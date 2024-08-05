//@ts-nocheck
import { FieldType, MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getMetricsComposite } from '../api';
import { getTemplateSrv } from '@grafana/runtime';
import { MetricParams } from '../utils/makeMetricTimeSeriesParams';

export function metricsCompositeQuery(query, datasource) {
  const { timeInterval } = datasource;
  const { measure, baseLine, showMultiline, functions, sortBy, size, addQuery } = query;
  let dimensions = JSON.parse(query.dimensions);
  const dashboardVars = query.applyVariables ? getTemplateSrv().getVariables() : [];
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

  const metricsParams: MetricParams = {
    measure,
    dimensions,
    includeBaseline: baseLine,
    functions,
    sortBy,
    size,
    addQuery,
  };

  return getMetricsComposite({ addQuery, ...metricsParams }, { timeInterval }, datasource).then(({ metrics }) => {
    let fields = [{ name: 'time', type: FieldType.time }];
    const timeMap = {};
    if (addQuery && metrics.length) {
      metrics.forEach(({ name, dataPoints }) => {
        fields.push({ name, type: FieldType.number });
        dataPoints.forEach(([time, value]) => {
          timeMap[time] = timeMap[time] || {};
          timeMap[time][name] = value;
        });
      });
    }

    const frame = new MutableDataFrame({
      refId: query.refId,
      name: `${query.refId}-anodot-${scenarios.metrics}`,
      meta: { type: 'timeseries-wide', preferredVisualisationType: 'graph' },
      fields,
    });

    if (addQuery && metrics.length) {
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

    frame.serieName = scenarios.metricsComposite;
    frame.anodotPayload = {
      showMultiline,
      metricsComposite: metrics?.map((m) => ({ ...m, meta: metricsParams })),
      meta: metricsParams,
      timeInterval,
      query,
    };
    return frame; //TODO: return multiple series works well with native Graph but requires changes on anodot-panel side
  });
}
