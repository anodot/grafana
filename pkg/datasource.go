package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

type dataSource struct {
	im instancemgmt.InstanceManager
}

func newDataSource() *dataSource {
	return &dataSource{
		im: datasource.NewInstanceManager(newDataSourceInstance),
	}
}

// CallResource handles any requests to /api/datasources/:id/resources.
//
// req contains information about the HTTP request
// sender is used for returning a response back to the client
func (ds *dataSource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Path != "access-token" {
		sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
		})
		return nil
	}

	instance, err := ds.im.Get(req.PluginContext)
	if err != nil {
		return err
	}

	dsInstance := instance.(*dataSourceInstance)

	var jsonData struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(dsInstance.settings.JSONData, &jsonData); err != nil {
		return err
	}

	refreshToken := dsInstance.settings.DecryptedSecureJSONData["token"]

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
