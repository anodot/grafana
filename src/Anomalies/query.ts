//@ts-nocheck
import { MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getQ, getQueryParamsUrl } from '../utils/helpers';
import { loadAnomalyData, getAnomalyChart } from '../api';

export async function anomalyQuery(query, timeInterval, urlBase, callId) {
  const { metrics, requestCharts, includeBaseline } = query;
  if (!metrics?.length) {
    return new Promise(() => null);
  }
  const anomalyDataPromises = makeAnomaliesPromises(query, [], timeInterval, urlBase);

  return Promise.all(anomalyDataPromises).then(async results => {
    const anomalyDatasets = metrics.map(({ value }, i) => ({
      metricName: value,
      dataSet: results[i]?.map(a => ({ ...a, metricName: value })),
    }));

    let anomaliesCharts;

    if (requestCharts) {
      const params = { baseline: includeBaseline, timeInterval };
      const flattenResults = [].concat(...results);
      const anomalyChartsPromises = flattenResults.map(anomaly => getAnomalyChart(anomaly, params, urlBase));
      anomaliesCharts = await Promise.all(anomalyChartsPromises);
    }
    const frame = new MutableDataFrame({
      refId: query.refId,
      fields: [],
    });

    frame.serieName = scenarios.anomalies;
    frame.anodotPayload = {
      showCharts: requestCharts,
      anomalies: anomalyDatasets,
      anomaliesCharts,
      callId,
      timeInterval,
      query,
    };

    return frame;
  });
}

export function makeAnomaliesPromises(query, defaultPromises, timeInterval, urlBase) {
  const {
    metrics,
    score = [0],
    duration = [0],
    sortBy,
    openedOnly,
    direction = [],
    deltaValue,
    deltaType,
    filters = [],
    timeScales,
  } = query;

  if (
    metrics?.length &&
    score !== undefined &&
    timeInterval !== undefined &&
    duration !== undefined &&
    deltaType &&
    direction.length &&
    timeScales?.length
  ) {
    const smallestTimescale = timeScales.sort((a, b) => a.meta[3] - b.meta[3])[0];
    return metrics.map(({ value }) => {
      const anomalyParams = {
        ...timeInterval,
        index: 0,
        size: 10, //TODO: V.2.0 Add paging
        score: (score[0] ?? score) / 100,
        durationUnit: smallestTimescale.meta[1],
        durationValue: duration[0] ?? duration,
        resolution: timeScales.map(t => t.meta[2]),
        anomalyType: 'all',
        bookmark: '',
        correlation: '',
        delta: deltaValue,
        deltaType: deltaType,
        order: 'desc',
        q: getQ(value, filters, true),
        sort: sortBy,
        startBucketMode: true,
        state: openedOnly ? 'open' : 'both',
        valueDirection: direction[1] ? 'both' : direction[0]?.value,
      };
      return loadAnomalyData(getQueryParamsUrl(anomalyParams, '/anomalies'), urlBase, value);
    });
  } else {
    return defaultPromises;
  }
}
