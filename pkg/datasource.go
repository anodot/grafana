package main

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
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

type dataSource struct {
	im instancemgmt.InstanceManager
}

const tokenRefreshInterval = 40 * time.Minute

// Define the JSON data struct
type jsonDataStruct struct {
	URL     string `json:"url"`
	POSTFIX string `json:"apiPostfix"`
}

var (
	tokenStorage         string
	lastTokenRefreshTime time.Time
	debounceDuration     = 2 * time.Minute // Adjust as needed
	jsonData             jsonDataStruct
)
var once sync.Once

func handleError(err error, sender backend.CallResourceResponseSender) {
	if err != nil {
		fullErrMsg := fmt.Sprintf("%s: %v", "Error", err)
		sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(fullErrMsg),
		})
	}
}

func handlePanic(sender backend.CallResourceResponseSender) {
	if r := recover(); r != nil {
		errMsg := fmt.Sprintf("Panic occurred: %v", r)
		// Send a detailed error response to the client
		sender.Send(&backend.CallResourceResponse{
			Status: http.StatusInternalServerError,
			Body:   []byte(errMsg),
		})
	}
}

func newDataSource() *dataSource {
	return &dataSource{
		im: datasource.NewInstanceManager(newDataSourceInstance),
	}
}

func doRefreshToken(apiToken string, jsonData *jsonDataStruct, sender backend.CallResourceResponseSender, isTokenRequest bool) (string, error) {
	defer handlePanic(sender)
	payload, err := json.Marshal(map[string]string{"refreshToken": apiToken})
	if err != nil {
		handleError(err, sender)
		return "", err
	}

	authReq, err := http.NewRequest("POST", jsonData.URL+"/api/v2/access-token", bytes.NewReader(payload))
	if err != nil {
		handleError(err, sender)
		return "", err
	}
	authReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		handleError(err, sender)
		return "", err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		handleError(err, sender)
		return "", err
	}

	if resp.StatusCode == http.StatusOK {
		lastTokenRefreshTime = time.Now()
		if isTokenRequest {
			// Here we just forward the response from the API call since we're only
			// acting as a proxy.
			sender.Send(&backend.CallResourceResponse{
				Status:  resp.StatusCode,
				Headers: resp.Header,
				Body:    b,
			})
		}
		return strings.Trim(string(b), "\""), nil
	}

	return "", fmt.Errorf("failed to refresh token: HTTP status code %d", resp.StatusCode)
}

func (ds *dataSource) refreshTokenPeriodically(apiToken string) {
	// Initially wait for a short time before first token refresh
	time.Sleep(1 * time.Minute)

	// Set up a ticker to trigger token refresh every tokenRefreshInterval
	ticker := time.Tick(tokenRefreshInterval)
	for range ticker {
		// Trigger token refresh
		payload, err := json.Marshal(map[string]string{"refreshToken": apiToken})
		if err != nil {
			continue
		}

		authReq, err := http.NewRequest("POST", jsonData.URL+"/api/v2/access-token", bytes.NewReader(payload))
		if err != nil {
			continue
		}
		authReq.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(authReq)
		if err != nil {
			continue
		}

		b, err := ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		if resp.StatusCode == http.StatusOK {
			tokenStorage = strings.Trim(string(b), "\"")
		}
	}
}

// CallResource handles any requests to /api/datasources/:id/resources.
//
// req contains information about the HTTP request
// sender is used for returning a response back to the client
func (ds *dataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	instance, err := ds.im.Get(req.PluginContext)
	if err != nil {
		handleError(err, sender)
		return err
	}

	dsInstance := instance.(*dataSourceInstance)

	if err := json.Unmarshal(dsInstance.settings.JSONData, &jsonData); err != nil {
		handleError(err, sender)
		return err
	}

	var apiToken = dsInstance.settings.DecryptedSecureJSONData["token"]
	once.Do(func() {
		// Start a goroutine to refresh the token periodically
		go ds.refreshTokenPeriodically(apiToken)
	})

	if (req.Path == "access-token") || (tokenStorage == "") {
		newToken, err := doRefreshToken(apiToken, &jsonData, sender, req.Path == "access-token")
		if err != nil {
			handleError(err, sender)
			return err
		}
		tokenStorage = newToken
	}

	payload := req.Body
	if req.Method == "GET" {
		payload = []byte("")
	}

	authReq, err := http.NewRequest(req.Method, jsonData.URL+jsonData.POSTFIX+req.URL, bytes.NewReader(payload))
	if err != nil {
		handleError(err, sender)
		return err
	}

	authReq.Header.Set("Content-Type", "application/json")
	authReq.Header.Set("Authorization", "Bearer "+tokenStorage)

	resp, err := http.DefaultClient.Do(authReq)
	if err != nil {
		handleError(err, sender)
		return err
	}

	if resp.StatusCode != http.StatusOK && time.Since(lastTokenRefreshTime) > debounceDuration {
		newToken, err := doRefreshToken(apiToken, &jsonData, sender, false)
		if err != nil {
			handleError(err, sender)
			return err
		}
		tokenStorage = newToken
		authRetryReq, err := http.NewRequest(req.Method, jsonData.URL+jsonData.POSTFIX+req.URL, bytes.NewReader(payload))
		if err != nil {
			handleError(err, sender)
			return err
		}

		authRetryReq.Header.Set("Content-Type", "application/json")
		authRetryReq.Header.Set("Authorization", "Bearer "+newToken)
		_, retryErr := http.DefaultClient.Do(authRetryReq)
		if retryErr != nil {
			handleError(retryErr, sender)
			return retryErr
		}
	}

	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		handleError(err, sender)
		return err
	}

	// Here we just forward the response from the API call since we're only
	// acting as a proxy.
	sender.Send(&backend.CallResourceResponse{
		Status:  resp.StatusCode,
		Headers: resp.Header,
		Body:    b,
	})

	return nil
}

// dataSourceInstance is the specific instance of a data source.
type dataSourceInstance struct {
	settings backend.DataSourceInstanceSettings
}

func newDataSourceInstance(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &dataSourceInstance{settings: settings}, nil
}
