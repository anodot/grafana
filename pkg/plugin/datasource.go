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
	"github.com/anodot/grafana-datasource/pkg/models"
)

var tokenStorage string = ""

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(_ context.Context, _ backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &Datasource{}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct{}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return backend.NewQueryDataResponse(), nil
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

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	res := &backend.CheckHealthResult{}
	config, err := models.LoadPluginSettings(*req.PluginContext.DataSourceInstanceSettings)

	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = "Unable to load settings"
		return res, nil
	}

	if config.Secrets.ApiKey == "" {
		res.Status = backend.HealthStatusError
		res.Message = "API key is missing"
		return res, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}

func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	var jsonData struct {
		URL     string `json:"url"`
		POSTFIX string `json:"apiPostfix"`
	}

	if err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &jsonData); err != nil {
		return err
	}

	if req.Path == "access-token" || tokenStorage == "" {
		// Get the API token with refresh token from Datasource config
		refreshToken := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["token"]

		payload, err := json.Marshal(map[string]string{"refreshToken": refreshToken})
		if err != nil {
			return err
		}

		authReq, err := http.NewRequest("POST", jsonData.URL+"/api/v2/access-token", bytes.NewReader(payload))
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

	authReq, err := http.NewRequest(req.Method, jsonData.URL+jsonData.POSTFIX+req.URL, bytes.NewReader(payload))
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
