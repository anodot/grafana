//@ts-nocheck
import { FieldType } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getQ, getQueryParamsUrl } from '../utils/helpers';
import { loadAnomalyData, getAnomalyChart } from '../api';
import { getTemplateSrv } from '@grafana/runtime';
import { MeasureWithComposites } from '../types';

export async function anomalyQuery(query, datasource) {
  const { timeInterval, callId, urlBase } = datasource;
  const { metrics = [], requestCharts, includeBaseline, addQuery } = query;
  const anomalyDataPromises = makeAnomaliesPromises(query, [], datasource);

  return Promise.all(anomalyDataPromises).then(async (results) => {
    const anomalyDatasets = metrics.map((metric: MeasureWithComposites, i) => ({
      metricName: metric?.value,
      dataSet: results[i]?.map((a) => ({ ...a, metricName: metric?.value })) || [],
    }));

    let anomaliesCharts = [];

    if (requestCharts) {
      const params = { baseline: includeBaseline, timeInterval };
      const flattenResults = [].concat(...results);
      const anomalyChartsPromises = flattenResults.map((anomaly) => getAnomalyChart(anomaly, params, datasource));
      anomaliesCharts = await Promise.all(anomalyChartsPromises);
    }

    let fields = [{ name: 'time', type: FieldType.time }];
    const timeMap = {};

    if (addQuery && anomaliesCharts.length) {
      anomaliesCharts.forEach(({ name, dataPoints }) => {
        fields.push({ name, type: FieldType.number });
        dataPoints.forEach(([time, value]) => {
          timeMap[time] = timeMap[time] || {};
          timeMap[time][name] = value;
        });
      });
    }

    const frame = new MutableDataFrame({
      refId: query.refId,
      name: `${query.refId}-series`,
      meta: { type: 'timeseries-wide', preferredVisualisationType: 'graph' },
      fields,
    });

    if (addQuery && anomaliesCharts.length) {
      Object.entries(timeMap).forEach(([time, points]) => {
        frame.add({
          time: time * 1000,
          ...points,
        });
      });
    } else {
      frame.add({
        time: Date.now(),
      });
    }

    frame.serieName = scenarios.anomalies;
    frame.anodotPayload = {
      showCharts: requestCharts,
      anomalies: anomalyDatasets,
      anomaliesCharts,
      callId,
      timeInterval,
      query,
      urlBase,
      meta: {
        dimensions: query.dimensions ? JSON.parse(query.dimensions) : [],
        metrics,
      },
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
    // filters = [],
    timeScales,
    notOperator,
    size = 10,
    durationUnit,
    applyVariables,
  } = query;
  let dimensions = query.dimensions ? JSON.parse(query.dimensions) : [];
  const dashboardVars = applyVariables ? getTemplateSrv().getVariables() : [];
  const dashboardDimensions = dashboardVars
    .filter((v) => v.current.value && v.description?.includes('[anodot-dimension]'))
    .map((v) => ({ key: v.id, value: v.current.value }));
  if (dashboardDimensions?.length) {
    /* push all elements at one time */
    Array.prototype.push.apply(dimensions, dashboardDimensions);
  }
  const uniqDimensionsMap = (dimensions || [])
    .filter((d) => d.key)
    .reduce((res, { key, value, not }) => {
      res[key] = res[key] || [];
      if (typeof value === 'string') {
        res[key].push(value);
      } else if (value?.length) {
        Array.prototype.push.apply(
          res[key],
          value.map((d) => d.value)
        );
      }
      return res;
    }, {});
  dimensions = Object.entries(uniqDimensionsMap)
    .filter(([key, values]) => key && values.length)
    .map(([key, values]) => ({ key, value: values.join(' OR '), type: 'property', isExact: true }));

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
    const anomalyParams = {
      ...timeInterval,
      index: 0,
      size,
      score: (score[0] ?? score) / 100,
      durationUnit,
      durationValue: duration?.[0] ?? duration,
      resolution: timeScales.map((t) => t.meta[2]),
      anomalyType: 'all',
      bookmark: '',
      correlation: '',
      delta: deltaValue,
      deltaType: deltaType,
      order: 'desc',
      q: getQ(metrics, dimensions, true, notOperator),
      sort: sortBy,
      startBucketMode: true,
      state: openedOnly ? 'open' : 'both',
      valueDirection: direction[1] ? 'both' : direction[0]?.value,
    };

    return [loadAnomalyData(getQueryParamsUrl(anomalyParams, '/anomalies'), metrics[0]?.value, ds)];
  } else {
    return defaultPromises;
  }
}
