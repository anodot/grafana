package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"bytes"
    "io/ioutil"
    "net/http"
    "strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

var tokenStorage string = ""

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.CallResourceHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)
// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
    url         string
    apiPostfix  string
    refreshToken string
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

        return &Datasource{
            url:         jsonData.URL,
            apiPostfix:  jsonData.POSTFIX,
            refreshToken: refreshToken,
        }, nil
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

func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Path == "access-token" || tokenStorage == "" {
		payload, err := json.Marshal(map[string]string{"refreshToken": d.refreshToken})
		if err != nil {
			return err
		}

		authReq, err := http.NewRequest("POST", d.url+"/api/v2/access-token", bytes.NewReader(payload))
		if err != nil {
			return err
		}
		authReq.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(authReq)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		if resp.StatusCode == 200 {
			tokenStorage = strings.Trim(string(b), "\"")
		}

		if req.Path == "access-token" {
			// Forward the response from the API call since we're only acting as a proxy.
			sender.Send(&backend.CallResourceResponse{
				Status:  resp.StatusCode,
				Headers: resp.Header,
				Body:    b,
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

	tokenStr := "Bearer " + tokenStorage
	authReq.Header.Set("Content-Type", "application/json")
	authReq.Header.Set("Authorization", tokenStr)

	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

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
