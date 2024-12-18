package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	url          string
	apiPostfix   string
	refreshToken string

	tokenMutex sync.RWMutex
	token      string // Instance-level token storage
}

// NewDatasource creates a new datasource instance.
func NewDatasource(_ context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var jsonData struct {
		URL     string `json:"url"`
		POSTFIX string `json:"apiPostfix"`
	}

	if err := json.Unmarshal(settings.JSONData, &jsonData); err != nil {
		return nil, err
	}

	refreshToken := settings.DecryptedSecureJSONData["token"]

	ds := &Datasource{
		url:          jsonData.URL,
		apiPostfix:   jsonData.POSTFIX,
		refreshToken: refreshToken,
	}

	return ds, nil
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

type queryModel struct{}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
	}

	// create data frame response.
	// For an overview on data frames and how grafana handles them:
	// https://grafana.com/developers/plugin-tools/introduction/data-frames
	frame := data.NewFrame("response")

	// add fields.
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
		data.NewField("values", nil, []int64{10, 20}),
	)

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// fetchAuthToken is responsible for requesting and retrieving an authentication token.
func (d *Datasource) fetchAuthToken() (string, error) {
	// Check if token is already valid
	backend.Logger.Info("Trying to fetch token")
	d.tokenMutex.RLock()
	if d.token != "" {
		defer d.tokenMutex.RUnlock()
		return d.token, nil
	}
	d.tokenMutex.RUnlock()
	payload, err := json.Marshal(map[string]string{"refreshToken": d.refreshToken})
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	authReq, err := http.NewRequest("POST", d.url+"/api/v2/access-token", bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	authReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		return "", fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode == http.StatusOK {
		backend.Logger.Info("Token was fetched")
		token := strings.Trim(string(b), "\"")
		// Safely store the token
		d.tokenMutex.Lock()
		d.token = token
		d.tokenMutex.Unlock()

		return token, nil
	}

	var errorResponse struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal(b, &errorResponse); err != nil || errorResponse.Message == "" {
		// If parsing fails or `message` field is missing, fallback to raw response
		backend.Logger.Info("failed to fetch token, status: %d, response: %s", resp.StatusCode, string(b))
		return "", fmt.Errorf("failed to fetch token, status: %d, response: %s", resp.StatusCode, string(b))
	}

	return "", fmt.Errorf(errorResponse.Message)
}

func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Path == "access-token" || d.token == "" {
		token, err := d.fetchAuthToken()
		if err != nil {
			sender.Send(&backend.CallResourceResponse{
				Status:  http.StatusBadRequest, // Return an appropriate error status
				Headers: http.Header{"Content-Type": []string{"application/json"}},
				Body:    []byte(fmt.Sprintf(`{"error": "%s"}`, err.Error())), // JSON-formatted error
			})
			return nil
		}

		if req.Path == "access-token" {
			tokenJSON, err := json.Marshal(map[string]string{"accessToken": token})
			if err != nil {
				return fmt.Errorf("failed to make: %w", err)
			}
			// Forward the response from the API call since we're only acting as a proxy.
			sender.Send(&backend.CallResourceResponse{
				Status:  http.StatusOK,
				Headers: http.Header{"Content-Type": []string{"application/json"}},
				Body:    tokenJSON,
			})
			return nil
		}
	}

	payload := req.Body
	if req.Method == "GET" {
		payload = []byte("")
	}

	authReq, err := http.NewRequest(req.Method, d.url+d.apiPostfix+req.URL, bytes.NewReader(payload))
	if err != nil {
		return err
	}

	tokenStr := "Bearer " + d.token
	authReq.Header.Set("Content-Type", "application/json")
	authReq.Header.Set("Authorization", tokenStr)

	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check if the response indicates that the token might be expired or invalid
	if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusUnauthorized {
		// Clear the existing token and attempt to fetch a new one
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		backend.Logger.Info("Data request %d failed with error: %s", req.URL, string(b))
		d.tokenMutex.Lock()
		d.token = ""
		d.tokenMutex.Unlock()

		// Fetch a new token
		token, err := d.fetchAuthToken()
		if err != nil {
			sender.Send(&backend.CallResourceResponse{
				Status:  http.StatusBadRequest, // Return an appropriate error status
				Headers: http.Header{"Content-Type": []string{"application/json"}},
				Body:    []byte(fmt.Sprintf(`{"error": "%s"}`, err.Error())), // JSON-formatted error
			})
			return nil
		}

		// Retry the request with the new token
		tokenStr = "Bearer " + token
		authReq.Header.Set("Authorization", tokenStr)

		// Execute the request again
		resp, err = http.DefaultClient.Do(authReq)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
	}

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Forward the response from the API call since we're only acting as a proxy.
	sender.Send(&backend.CallResourceResponse{
		Status:  resp.StatusCode,
		Headers: resp.Header,
		Body:    b,
	})

	return nil
}
