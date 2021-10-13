//@ts-nocheck
import { FieldType, MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getMetricsComposite } from '../api';
import { getTemplateSrv } from '@grafana/runtime';

export function metricsCompositeQuery(query, datasource) {
  const { timeInterval } = datasource;
  const { metricName, baseLine, showMultiline, functions, sortBy, size } = query;
  const dimensions = JSON.parse(query.dimensions);
  const dashboardVars = getTemplateSrv().getVariables();
  const dashboardDimensions = dashboardVars
    .filter((v) => v.current.value && v.description?.includes('[anodot-dimension]'))
    .map((v) => ({ key: v.id, value: v.current.value }));
  if (dashboardDimensions?.length) {
    /* push all elements at one time */
    Array.prototype.push.apply(dimensions, dashboardDimensions);
  }

  const metricsParams = {
    metricName: metricName,
    dimensions: (dimensions || [])
      .filter((d) => d.value)
      .map(({ key, value, not }) => ({ key, value: (not ? '!' : '') + value })),
    includeBaseline: baseLine,
    functions,
    sortBy,
    size,
  };

  return getMetricsComposite(metricsParams, { timeInterval }, datasource).then(({ metrics }) => {
    const frameSource = {
      refId: query.refId,
      fields: [
        { name: 'time', type: FieldType.time },
        { name: 'value', type: FieldType.number },
        { name: 'name', type: FieldType.string },
      ],
    };
    const frames = [];

    const singleFrame = new MutableDataFrame(frameSource);

    metrics?.forEach(({ dataPoints, name }, i) => {
      const frame = new MutableDataFrame(frameSource);
      dataPoints.forEach(([time, value]) => {
        frame.add({
          time: time * 1000,
          value,
          name,
        });
        singleFrame.add({
          time: time * 1000,
          value,
          name,
        });
      });
      frames.push(frame);
    });

    singleFrame.serieName = scenarios.metricsComposite;
    singleFrame.anodotPayload = {
      showMultiline,
      metricsComposite: metrics?.map((m) => ({ ...m, meta: metricsParams })),
      meta: metricsParams,
      timeInterval,
      query,
    };
    return singleFrame; //frames; TODO: return multiple series works well with native Graph but requires changes on anodot-panel side
  });
}
