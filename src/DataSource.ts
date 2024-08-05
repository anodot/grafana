// @ts-nocheck
import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { MyDataSourceOptions, EditorQuery, MeasureWithComposites } from './types';
import { getQueryParamsUrl, readTime } from './utils/helpers';
import { scenarios } from './utils/constants';
import { makePropValPayload } from './utils/makeParams';
import { metricsCompositeQuery } from './MetricsComposite/query';
import { alertsQuery } from './Alerts/query';
import { anomalyQuery } from './Anomalies/query';
import { topologyQuery } from './Topology/query';

const propsListDescription = [
  { valueType: 'measures', count: 20 },
  { valueType: 'composites', count: 10 },
  // { valueType: 'dimensions', count: 20 },
  // { valueType: 'streams', count: 10 },
  // { valueType: 'alerts', count: 10 },
  // { valueType: 'tags', count: 10 },
];
type ExpectedPropsListResponse = Array<{
  title: string;
  count: number;
  type: string;
  values: Array<string | MeasureWithComposites>;
}>;
export class DataSource extends DataSourceApi<EditorQuery, MyDataSourceOptions> {
  url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.id = instanceSettings.id;
    this.dsUrl = `/api/datasources/${instanceSettings.id}/resources`;
    this.urlBase = instanceSettings.jsonData.url;
  }

  async makeRequest(url, payload, params, thenCallback) {
    const defaultClb = ({ data }) => data;

    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url, payload, params))
      .then(thenCallback || defaultClb);
  }

  async testDatasource() {
    /* It runs on 'Test Datasource', and stores the API token from Anodot side in the server runtime */
    const defaultErrorMessage = 'Cannot connect to API. Please check your credentials in datasource config';

    try {
      const response = await getBackendSrv().datasourceRequest({
        url: this.dsUrl + '/access-token',
      });

      if (response.status === 200) {
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
    const fullUrl = this.dsUrl + (!params ? url : getQueryParamsUrl(params, url));
    return payload
      ? {
          url: fullUrl,
          method: 'POST',
          data: JSON.stringify(payload),
        }
      : {
          url: fullUrl,
          method: 'GET',
        };
  }

  async getMetricsOptions(expression = '') {
    const url = `/search/metrics/propsList`;
    const payload = {
      expression,
      filter: [],
      listDescription: propsListDescription,
      size: 50,
      search: '',
    };
    try {
      return await getBackendSrv()
        .datasourceRequest(this.getOptions(url, payload))
        .then(
          (d: { data: ExpectedPropsListResponse }): MeasureWithComposites[] =>
            d.data
              ?.map((d) =>
                d.values.map((v) => (typeof v === 'string' ? { value: v, type: d.type } : { ...v, type: d.type }))
              )
              .flat() || []
        );
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

  async getUsers(): Promise<any[]> {
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

  async getMetricsPropVal(metricName: string, propsName: string) {
    const url = '/search/metrics/props';
    const payload = makePropValPayload(metricName, propsName);
    return await getBackendSrv()
      .datasourceRequest(this.getOptions(url, payload))
      .then(({ data }) => data);
  }

  async query(options: DataQueryRequest<EditorQuery>): Promise<DataQueryResponse> {
    this.callId = Math.floor(Math.random() * 1000000);
    this.timeInterval = readTime(options.range!);

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
