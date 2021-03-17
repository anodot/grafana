// @ts-nocheck
import { getBackendSrv } from '@grafana/runtime';
import { getQueryParamsUrl } from './utils/helpers';
import { makeAnomalyTimeSeriesParams, makeMetricsPayload, makeMetricTimeSeriesParams } from './utils/makeParams';
import { urlApiPostfix } from './utils/constants';

const localStorageKey = 'andt-token';

export async function getEvents(urlBase, timeInterval) {
  const params = {
    fromDate: timeInterval?.startDate,
    toDate: timeInterval?.endDate,
    index: 0,
    size: 200,
    startBucketMode: false,
  };
  const payload = {
    filter: {
      categories: [],
      q: { expression: [] },
    },
    aggregation: null,
  };
  const url = getQueryParamsUrl(params, '/user-events/execute');

  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, url, payload))
    .then(({ data }) => {
      const result = data.events?.map(e => ({ ...e, startDate: e.date, isEvent: true }));
      result.type = 'events';
      return result;
    });
}
export async function getMetricsData(metricName, filters = [], urlBase, timeInterval) {
  const params = {
    fromDate: timeInterval?.startDate,
    toDate: timeInterval?.endDate,
    maxDataPoints: 500,
    index: 0,
    size: 1000,
  };
  const url = '/metrics/composite/names';
  const payload = makeMetricsPayload(metricName, filters);
  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, url, payload, params))
    .then(({ data }) => {
      const result = data?.metrics || [];
      result.type = 'metrics';
      result.metricName = metricName;
      return result;
    });
}
export async function loadAnomalyData(url, urlBase, metricName) {
  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, url))
    .then(({ data }) => {
      const result = data?.anomalies || [];
      result.type = 'anomalies';
      result.metricName = metricName;
      return result;
    });
}

export async function getAnomalyChart(anomaly, params, urlBase) {
  const url = `/anomalies/${anomaly.id}/metric/`;
  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, makeAnomalyTimeSeriesParams(anomaly, url, params)))
    .then(({ data }) => data)
    .catch(error => {
      console.log('Request Error - Anomaly Chart: ', anomaly, tParams, error);
      return {};
    });
}

export async function getAlerts(query, timeInterval, urlBase) {
  const { severities = [], types, recipient = [] } = query;
  let subscribers = [];
  let channels = [];

  recipient.forEach(r => {
    if (r.type === 'channel') {
      channels.push(r.value);
    }
    if (r.type === 'user') {
      subscribers.push(r.value);
    }
  });

  const params = {
    severities: severities.length ? severities : null,
    types,
    startTime: timeInterval?.startDate,
    size: 100,
    subscribers: subscribers.length ? subscribers.join(',') : null,
    channels: channels.length ? channels.join(',') : null,
    order: 'desc',
    sort: 'updatedTime',
  };
  let url = '/alerts/triggered';

  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, url, null, params))
    .then(({ data }) => data);
}

export async function getMetricsComposite(metricParams, timeParams, urlBase: string) {
  const url = '/metrics/composite/execute';
  const [urlWithParams, payload] = makeMetricTimeSeriesParams(metricParams, timeParams, url);
  return await getBackendSrv()
    .datasourceRequest(getOptions(urlBase, urlWithParams, payload))
    .then(({ data }) => data);
}

function getOptions(urlBase: string, url: string, payload?: object | null, params?: object) {
  const fullUrl = urlBase + urlApiPostfix + (!params ? url : getQueryParamsUrl(params, url));
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
