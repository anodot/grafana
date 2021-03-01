// @ts-nocheck
import { getDateRange, getQ, getQueryParamsUrl } from './helpers';

export const makeMetricsPayload = (metricName, filters = []) => ({
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
      searchObject: getQ(metricName, filters),
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

export function makeAnomalyTimeSeriesParams(anomaly, url, { baseline = false, datapoints = true }) {
  const { resolution, startDate, endDate, id, metrics = [] } = anomaly;
  const metricId = metrics[0]?.id;
  const anomalyDuration = endDate - startDate;
  const now = Math.floor(Date.now() / 1000);
  const sinceAnomaly = now - endDate;
  const anodotStartDate = startDate - Math.max(anomalyDuration * 11, sinceAnomaly * 3); // TODO: Define exactly

  const params = {
    anomalyId: id,
    startDate: anodotStartDate,
    endDate: now,
    resolution,
    metricId,
    startBucketMode: false,
    baseline,
    datapoints,
  };
  return getQueryParamsUrl(params, url + encodeURI(metricId));
}

export function makeMetricTimeSeriesParams(
  { metricName, dimensions = [], includeBaseline = false },
  { timeInterval },
  url
) {
  const params = {
    fromDate: timeInterval.startDate,
    toDate: timeInterval.endDate,
    includeBaseline,
    index: 0,
    maxDataPoints: 500,
    resolution: '',
    size: 10,
    startBucketMode: true,
  };

  const expression = dimensions.map(d => ({
    ...d,
    type: 'property',
    isExact: true,
  }));

  if (metricName) {
    expression.unshift({
      key: 'what',
      value: metricName,
      type: 'property',
      isExact: true,
    });
  }

  const payload = {
    composite: {
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
        id: '05c6-ae07c72815ca',
        type: 'function',
      },
      expressionTree: {
        root: {
          searchObject: {
            expression,
          },
          children: [],
          type: 'metric',
          id: 'eca1-20ff8e3d1c13',
          uiIndex: 0,
        },
      },
      scalarTransforms: [
        {
          function: 'current',
          children: [],
          id: '29bb-80728792db0f',
          parameters: [],
          type: 'function',
        },
      ],
      context: '',
    },
    selectors: [],
  };

  return [getQueryParamsUrl(params, url), payload];
}

export const makePropValPayload = (metricName, propertyName) => ({
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
  size: 1000,
});
