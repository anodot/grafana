//@ts-nocheck
import { FieldType, MutableDataFrame } from '@grafana/data';
import { scenarios } from '../utils/constants';
import { getMetricsComposite } from '../api';
import { getTemplateSrv } from '@grafana/runtime';

export function metricsCompositeQuery(query, datasource, dashboardVarMeasure) {
  const { timeInterval } = datasource;
  const { metricName, baseLine, showMultiline, functions, sortBy, size } = query;
  const dashboardVars = getTemplateSrv().getVariables();
  const dashboardDimensions = dashboardVars
    .filter(v => v.current.value && v.description?.includes('[anodot-dimension]'))
    .map(v => ({ key: v.id, value: v.current.value }));
  if (dashboardDimensions?.length) {
    Array.prototype.push.apply(query.dimensions, dashboardDimensions);
  }
  const metricsParams = {
    metricName: dashboardVarMeasure || metricName,
    dimensions: query.dimensions.filter(d => d.value),
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
      metricsComposite: metrics?.map(m => ({ ...m, meta: metricsParams })),
      meta: metricsParams,
      timeInterval,
      query,
    };
    return singleFrame; //frames; TODO: return multiple series works well with native Graph but requires changes on anodot-panel side
  });
}
