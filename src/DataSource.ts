// @ts-nocheck
import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { MyDataSourceOptions, EditorQuery } from './types';
import { getQueryParamsUrl, readTime } from './utils/helpers';
import { scenarios } from './utils/constants';
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
    const { url, apiPostfix } = instanceSettings?.jsonData;
    this.urlApi = url + apiPostfix;
    this.urlBase = url;
    this.id = instanceSettings.id;
    this.localStorageKey = `${instanceSettings.id}-${localStorageKey}`;
  }

  async makeRequest(url, payload, params, thenCallback) {
    const defaultClb = ({ data }) => data;
    let storedToken = localStorage.getItem(this.localStorageKey);
    if (!storedToken) {
      const tokenResponse = await this.testDatasource();
      const { isError, message } = tokenResponse;
      if (isError) {
        throw new Error(message);
      }
    }

    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url, payload, params))
      .then(thenCallback || defaultClb);
  }

  async testDatasource() {
    /* It runs on 'Test Datasource', and gets the Auth token from Anodot side */
    const defaultErrorMessage = 'Cannot connect to API. Please check your credentials in datasource config';

    try {
      const response = await getBackendSrv().datasourceRequest({
        url: `/api/datasources/${this.id}/resources/access-token`,
      });

      if (response.status === 200) {
        const token = await response.data;
        localStorage.setItem(this.localStorageKey, token);
        return {
          status: 'success',
          message: "You've  successfully authorized Anodot datasource",
        };
      } else {
        return {
          isError: true,
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
      Authorization: `Bearer ${localStorage.getItem(this.localStorageKey)}`,
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

  async getMetricsOptions(expression = '') {
    const url = `/search/metrics/props`;
    const payload = {
      properties: ['what'],
      expression,
      filter: [],
      size: 50,
    };
    try {
      return await getBackendSrv()
        .datasourceRequest(this.getOptions(url, payload))
        .then((d) => d.data?.propertyValues || []);
    } catch (error) {
      return {
        error: {
          message: error?.data?.message,
          status: error?.status,
          error,
        },
      };
    }
  }

  async getPropertiesDict(metric, expression = '') {
    const url = `/search/metrics/propandval`;
    const filter = !metric
      ? []
      : [
          {
            type: 'property',
            key: 'what',
            value: metric,
            isExact: true,
          },
        ];
    const payload = {
      expression,
      filter,
      size: 1000,
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

  async getUsers(): any[] {
    const url = '/users';
    return await this.makeRequest(url);
  }

  async getChannels(): any[] {
    const url = '/channels';
    return this.makeRequest(url);
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

    let storedToken = localStorage.getItem(this.localStorageKey);
    if (!storedToken) {
      const tokenResponse = await this.testDatasource();
      const { isError, message } = tokenResponse;
      if (isError) {
        throw new Error(message);
      }
    }

    const promises = options.targets.map((query) => {
      query.timeInterval = this.timeInterval;
      switch (query.scenario) {
        case scenarios.alerts: {
          return alertsQuery(query, this);
        }
        case scenarios.metricsComposite: {
          return metricsCompositeQuery(query, this);
        }

        case scenarios.topology: {
          const setFrameToDataSource = (frame) => (this.lastTopologyFrame = frame);
          return topologyQuery(query, setFrameToDataSource, this);
        }
        case scenarios.anomalies: {
          return anomalyQuery(query, this);
        }
        default:
          return new Promise(() => null);
      }
    });

    return Promise.all(promises).then((data) => {
      return { data: [].concat(...data) };
    });
  }
}
