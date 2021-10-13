//@ts-nocheck
import { requestStrategies, scenarios } from '../utils/constants';
import { makeAnomaliesPromises } from '../Anomalies/query';
import { MutableDataFrame } from '@grafana/data';
import { getEvents, getMetricsData } from '../api';

export function topologyQuery(query, setFrameToDataSource, datasource) {
  const { timeInterval, urlBase, callId, lastTopologyFrame } = datasource;
  const { metrics, requestsStrategy, showEvents } = query;
  if (!metrics?.length) {
    return new Promise(() => null);
  }
  if (requestsStrategy === requestStrategies.noRequests && lastTopologyFrame) {
    lastTopologyFrame.anodotPayload.query = query;
    return Promise.resolve(lastTopologyFrame);
  }

  const requestAll = !lastTopologyFrame || requestsStrategy === requestStrategies.all;
  const requestAnomaliesOnly = requestsStrategy === requestStrategies.anomaliesOnly;
  const requestEventsOnly = requestsStrategy === requestStrategies.eventsOnly;

  let metricDataPromises = [];
  let anomalyDataPromises = [];
  let eventsDataPromise = [];

  if (requestAll) {
    metricDataPromises = metrics.map(({ value }) => getMetricsData(value, [], datasource));
  }
  if (requestAll || requestAnomaliesOnly) {
    anomalyDataPromises = makeAnomaliesPromises(query, anomalyDataPromises, datasource);
  }
  if (showEvents && (requestAll || requestEventsOnly)) {
    eventsDataPromise = [getEvents(datasource)];
  }

  return Promise.all((metricDataPromises || []).concat(anomalyDataPromises, eventsDataPromise)).then((results) => {
    const metricsDatasets = results.reduce((res, curr) => {
      if (curr.type === 'metrics') {
        res.push({ metricName: curr.metricName, dataSet: curr });
      }
      return res;
    }, []);
    const anomalyDatasets = results.reduce((res, curr) => {
      if (curr.type === 'anomalies') {
        res.push({ metricName: curr.metricName, dataSet: curr });
      }
      return res;
    }, []);
    const eventsDataset = results.find((r) => r.type === 'events')?.[0] || [];

    const frame = new MutableDataFrame({
      refId: query.refId,
      fields: [],
    });

    frame.serieName = scenarios.topology;
    frame.anodotPayload = {
      metrics: requestAll ? metricsDatasets : lastTopologyFrame?.anodotPayload?.metrics,
      anomalies: requestAll || requestAnomaliesOnly ? anomalyDatasets : lastTopologyFrame?.anodotPayload?.anomalies,
      events: requestAll || requestEventsOnly ? eventsDataset : lastTopologyFrame?.anodotPayload?.events,
      callId,
      urlBase,
      query,
    };
    frame.anodotPayload.query.timeInterval = timeInterval;

    setFrameToDataSource(frame);

    return frame;
  });
}
