// @ts-nocheck
import { getBackendSrv } from '@grafana/runtime';
import { getQueryParamsUrl } from './utils/helpers';
import { makeAnomalyTimeSeriesParams, makeMetricsPayload, makeMetricTimeSeriesParams } from './utils/makeParams';

export async function getEvents(ds) {
  const { timeInterval } = ds;
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
    .datasourceRequest(getOptions(ds, url, payload))
    .then(({ data }) => {
      const result = data.events?.map((e) => ({ ...e, startDate: e.date, isEvent: true }));
      result.type = 'events';
      return result;
    });
}
export async function getMetricsData(metricName, filters = [], ds, notOperator) {
  const { timeInterval } = ds;
  const params = {
    fromDate: timeInterval?.startDate,
    toDate: timeInterval?.endDate,
    maxDataPoints: 500,
    index: 0,
    size: 500,
  };
  const url = '/metrics/composite/names';
  const payload = makeMetricsPayload(metricName, filters, notOperator);
  return await getBackendSrv()
    .datasourceRequest(getOptions(ds, url, payload, params))
    .then(({ data }) => {
      const result = data?.metrics || [];
      result.type = 'metrics';
      result.metricName = metricName;
      return result;
    });
}
export async function loadAnomalyData(url, metricName, ds) {
  return await getBackendSrv()
    .datasourceRequest(getOptions(ds, url))
    .then(({ data }) => {
      const result = data?.anomalies || [];
      result.type = 'anomalies';
      result.metricName = metricName;
      return result;
    });
}

export async function getAnomalyChart(anomaly, params, ds) {
  const url = `/anomalies/${anomaly.id}/metric/`;
  const { metricsCount } = anomaly;
  return await getBackendSrv()
    .datasourceRequest(getOptions(ds, makeAnomalyTimeSeriesParams(anomaly, url, params)))
    .then(({ data }) => ({ ...data, metricsCount }))
    .catch((error) => {
      console.error('Request Error - Anomaly Chart: ', anomaly, tParams, error);
      return {};
    });
}

export async function getAlerts(query, ds) {
  const { timeInterval } = ds;
  const { severities = [], types = [], recipient = [], showOpen, acknowledge, feedback = [] } = query;
  let subscribers = [];
  let channels = [];

  recipient.forEach((r) => {
    if (r.type === 'channel') {
      channels.push(r.value);
    }
    if (r.type === 'user') {
      subscribers.push(r.value);
    }
  });

  const params = {
    severities: severities.length ? severities : null,
    types: types?.length ? types : undefined,
    startTime: timeInterval?.startDate,
    size: 200,
    subscribers: subscribers.length ? subscribers.join(',') : null,
    channels: channels.length ? channels.join(',') : null,
    order: 'desc',
    sort: 'updatedTime',
  };

  feedback.forEach((option) => {
    params[option.value] = true;
  });

  if (showOpen) {
    params.status = 'OPEN';
  }
  if (acknowledge && (acknowledge === 'ACK' || acknowledge === 'NOACK')) {
    params.ack = acknowledge;
  }
  let url = '/alerts/triggered';

  return await getBackendSrv()
    .datasourceRequest(getOptions(ds, url, null, params))
    .then(({ data }) => data);
}

export async function getMetricsComposite(metricParams, timeParams, ds) {
  const url = '/metrics/composite/execute';
  const [urlWithParams, payload] = makeMetricTimeSeriesParams(metricParams, timeParams, url);
  return await getBackendSrv()
    .datasourceRequest(getOptions(ds, urlWithParams, payload))
    .then(({ data }) => data);
}

function getOptions(datasource, url: string, payload?: object | null, params?: object) {
  const { dsUrl } = datasource;
  const fullUrl = dsUrl + (!params ? url : getQueryParamsUrl(params, url));

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
