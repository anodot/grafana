//@ts-nocheck
import { MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getQ, getQueryParamsUrl } from '../utils/helpers';
import { loadAnomalyData, getAnomalyChart } from '../api';

export async function anomalyQuery(query, datasource) {
  const { timeInterval, callId } = datasource;
  const { metrics = [], requestCharts, includeBaseline } = query;
  const anomalyDataPromises = makeAnomaliesPromises(query, [], datasource);

  return Promise.all(anomalyDataPromises).then(async results => {
    const anomalyDatasets = metrics.map(({ value }, i) => ({
      metricName: value,
      dataSet: results[i]?.map(a => ({ ...a, metricName: value })) || [],
    }));

    let anomaliesCharts;

    if (requestCharts) {
      const params = { baseline: includeBaseline, timeInterval };
      const flattenResults = [].concat(...results);
      const anomalyChartsPromises = flattenResults.map(anomaly => getAnomalyChart(anomaly, params, datasource));
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

export function makeAnomaliesPromises(query, defaultPromises, ds) {
  const {
    metrics = [],
    score = [0],
    duration = [0],
    sortBy,
    openedOnly,
    direction = [],
    deltaValue,
    deltaType,
    filters = [],
    timeScales,
    notOperator,
    size = 10,
    durationUnit,
  } = query;

  const { timeInterval } = ds;

  if (!metrics?.length) {
    /* "no metrics" case */
    metrics.push({ value: undefined });
  }

  if (
    score !== undefined &&
    timeInterval !== undefined &&
    duration !== undefined &&
    deltaType &&
    direction.length &&
    timeScales?.length
  ) {
    return metrics.map(({ value }) => {
      const anomalyParams = {
        ...timeInterval,
        index: 0,
        size,
        score: (score[0] ?? score) / 100,
        durationUnit,
        durationValue: duration?.[0] ?? duration,
        resolution: timeScales.map(t => t.meta[2]),
        anomalyType: 'all',
        bookmark: '',
        correlation: '',
        delta: deltaValue,
        deltaType: deltaType,
        order: 'desc',
        q: getQ(value, filters, true, notOperator),
        sort: sortBy,
        startBucketMode: true,
        state: openedOnly ? 'open' : 'both',
        valueDirection: direction[1] ? 'both' : direction[0]?.value,
      };
      return loadAnomalyData(getQueryParamsUrl(anomalyParams, '/anomalies'), value, ds);
    });
  } else {
    return defaultPromises;
  }
}
