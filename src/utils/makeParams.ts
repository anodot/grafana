import { getDateRange, getQ, getQueryParamsUrl } from './helpers';
import { MeasureWithComposites } from '../types';

export const makeMetricsPayload = (measure: MeasureWithComposites, filters = [], notOperator) => ({
  name: {
    auto: true,
    prefix: null,
  },
  displayOnly: true,
  filter: {
    function: 'alphanumeric',
    parameters: [
      {
        name: 'Top N',
        value: 10,
      },
    ],
    children: [],
    id: '6fbf-1c1c5f022de7',
    type: 'function',
  },
  expressionTree: {
    root: {
      searchObject: getQ([measure], filters, false, notOperator),
      children: [],
      type: 'metric',
      id: '5800-25645814655e',
      uiIndex: 0,
    },
  },
  context: '',
});

export const makeAnomaliesParams = (
  {
    delta = 0,
    deltaType = 'absolute',
    timeInterval,
    state = 'both',
    durationUnit,
    sort,
    duration,
    score,
    metric,
    filters = [],
    resolution,
    valueDirection = 'both',
  },
  index,
  size
) => {
  const params = {
    ...getDateRange(timeInterval, true),
    index,
    size,
    score,
    durationUnit,
    durationValue: duration,
    resolution,
    anomalyType: 'all',
    bookmark: '',
    correlation: '',
    delta,
    deltaType,
    order: 'desc',
    q: getQ(metric, filters, true),
    sort,
    startBucketMode: true,
    state,
    valueDirection,
  };
  return getQueryParamsUrl(params, '/anomalies');
};

export function makeAnomalyTimeSeriesParams(anomaly, url, { baseline = false, datapoints = true, timeInterval }) {
  const { resolution, startDate, endDate, id, metrics = [] } = anomaly;
  const metricId = metrics[0]?.id;
  const anomalyDuration = endDate - startDate;
  const endOfRequestedPeriod = timeInterval?.endDate || Math.floor(Date.now() / 1000);
  const sinceAnomaly = endOfRequestedPeriod - endDate;
  const anodotStartDate = startDate - Math.max(anomalyDuration * 11, sinceAnomaly * 3); // TODO: Define exactly
  const params = {
    anomalyId: id,
    startDate: anodotStartDate,
    endDate: endOfRequestedPeriod,
    resolution,
    metricId,
    startBucketMode: false,
    baseline,
    datapoints,
  };
  return getQueryParamsUrl(params, url + encodeURIComponent(metricId));
}

export const makePropValPayload = (metricName: string, propertyName?: string) => ({
  properties: propertyName ? [propertyName] : [],
  expression: '',
  filter: [
    {
      type: 'property',
      key: 'what',
      value: metricName,
      isExact: true,
    },
  ],
  size: 500,
});
