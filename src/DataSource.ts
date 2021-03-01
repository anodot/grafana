// @ts-nocheck
import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { MyDataSourceOptions, EditorQuery } from './types';
import { getQueryParamsUrl, readTime } from './utils/helpers';
import { scenarios, urlApiPostfix } from './utils/constants';
import { makePropValPayload } from './utils/makeParams';
import { metricsCompositeQuery } from './MetricsComposite/query';
import { alertsQuery } from './Alerts/query';
import { anomalyQuery } from './Anomalies/query';
import { topologyQuery } from './Topology/query';

const localStorageKey = 'andt-token';

export class DataSource extends DataSourceApi<EditorQuery, MyDataSourceOptions> {
  url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    const { token, url } = instanceSettings?.jsonData;
    this.urlApi = url + urlApiPostfix;
    this.urlBase = url;
    this.refreshToken = token;

    getLocationSrv().update({
      query: {
        'var-service': 'billing',
      },
      partial: true,
      replace: true,
    });
  }

  async testDatasource() {
    /* It runs on 'Test Datasource', and gets the Auth token from Anodot side */
    const defaultErrorMessage = 'Cannot connect to API';
    try {
      const response = await fetch(this.urlApi + '/access-token', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        // referrer: '',
        //referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': 'application/json',
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }), // body data type must match "Content-Type" header
      });

      if (response.status === 200) {
        const token = await response.json();
        localStorage.setItem(localStorageKey, token);
        return {
          status: 'success',
          message: "You've  successfully authorized Anodot datasource",
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      if (_.isString(err)) {
        return {
          status: 'error',
          message: err,
        };
      } else {
        let message = '';
        message += err.statusText ? err.statusText : defaultErrorMessage;
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }

        return {
          status: 'error',
          message,
        };
      }
    }
  }

  getOptions(url, payload, params) {
    const fullUrl = this.urlApi + (!params ? url : getQueryParamsUrl(params, url));
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem(localStorageKey)}`,
    };
    return payload
      ? {
          url: fullUrl,
          method: 'POST',
          data: JSON.stringify(payload),
          headers,
        }
      : {
          url: fullUrl,
          method: 'GET',
          headers,
        };
  }

  async getMetricsOptions() {
    const url = `/search/metrics/props`;
    const payload = {
      properties: ['what'],
      expression: '',
      filter: [],
      size: 10000,
    };
    try {
      return await getBackendSrv()
        .datasourceRequest(this.getOptions(url, payload))
        .then(d => d.data?.propertyValues || []);
    } catch (error) {
      return {
        error: {
          message: error?.data?.message,
          status: error?.status,
        },
      };
    }
  }

  async getPropertiesDict(metric) {
    const url = `/search/metrics/propandval`;
    const payload = {
      expression: '',
      filter: [
        {
          type: 'property',
          key: 'what',
          value: metric,
          isExact: true,
        },
      ],
      size: 10000,
    };
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url, payload))
      .then(({ data: { properties, propertyValues } }) => ({
        properties: properties?.properties,
        propertyValues: propertyValues?.propertyValues?.reduce((res, { key, value }) => {
          res[key] = res[key] || [];
          res[key].push(value);
          return res;
        }, {}),
      }));
  }

  async getUsers() {
    const url = '/users';
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url))
      .then(({ data }) => data);
  }

  async getChannels() {
    const url = '/channels';
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url))
      .then(({ data }) => data);
  }

  async getMetricsValues(metricName) {
    const url = `/metrics/${metricName}?token=6d0f120ac0d8da4b756b16995fda0025&from=1y`;
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url))
      .then(({ data }) => data);
  }

  async getMetricsPropVal(metricName, propsName) {
    const url = '/search/metrics/props';
    const payload = makePropValPayload(metricName, propsName);
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url, payload))
      .then(({ data }) => data);
  }

  async query(options: DataQueryRequest<EditorQuery>): Promise<DataQueryResponse> {
    this.callId = Math.floor(Math.random() * 1000000);
    this.timeInterval = readTime(options.range!);

    const promises = options.targets.map(query => {
      query.timeInterval = this.timeInterval;
      switch (query.scenario) {
        case scenarios.alerts: {
          return alertsQuery(query, this.timeInterval, this.urlBase);
        }
        case scenarios.metricsComposite: {
          return metricsCompositeQuery(query, this.timeInterval, this.urlBase);
        }

        case scenarios.topology: {
          const setFrameToDataSource = frame => (this.lastTopologyFrame = frame);
          return topologyQuery(
            query,
            this.timeInterval,
            this.urlBase,
            this.callId,
            this.lastTopologyFrame,
            setFrameToDataSource
          );
        }
        case scenarios.anomalies: {
          return anomalyQuery(query, this.timeInterval, this.urlBase, this.callId);
        }
        default:
          return new Promise(() => null);
      }
    });

    return Promise.all(promises).then(data => ({ data }));
  }
}
