//@ts-nocheck
import { FieldType, MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getMetricsComposite } from '../api';

export function metricsCompositeQuery(query, timeInterval, urlBase) {
  const { metricName, dimensions = [], baseLine, showMultiline, functions } = query;
  const metricsParams = {
    metricName,
    dimensions: dimensions.filter(d => d.value),
    includeBaseline: baseLine,
    functions,
  };

  return getMetricsComposite(metricsParams, { timeInterval }, urlBase).then(({ metrics }) => {
    const frame = new MutableDataFrame({
      refId: query.refId,
      fields: [
        { name: 'time', type: FieldType.time },
        { name: 'value', type: FieldType.number },
        { name: 'name', type: FieldType.string },
      ],
    });

    metrics?.forEach(({ dataPoints }, i) => {
      dataPoints.forEach(([time, value]) => {
        frame.add({
          time: time * 1000,
          value,
          name: 'chart-' + i,
        });
      });
    });

    frame.serieName = scenarios.metricsComposite;
    frame.anodotPayload = {
      showMultiline,
      metricsComposite: metrics?.map(m => ({ ...m, meta: metricsParams })),
      meta: metricsParams,
      timeInterval,
      query,
    };

    return frame;
  });
}
