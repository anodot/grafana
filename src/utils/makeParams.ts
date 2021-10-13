// @ts-nocheck
import { getDateRange, getQ, getQueryParamsUrl } from './helpers';
import isObject from 'lodash/isObject';

export const makeMetricsPayload = (metricName, filters = [], notOperator) => ({
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
      searchObject: getQ(metricName, filters, false, notOperator),
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

export function makeMetricTimeSeriesParams(
  { metricName, dimensions = [], includeBaseline = false, functions, sortBy, size },
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
    size: size,
    startBucketMode: true,
  };

  const expression = dimensions.map((d) => ({
    ...d,
    type: 'property',
    isExact: !true,
  }));

  if (metricName) {
    expression.unshift({
      key: 'what',
      value: metricName,
      type: 'property',
      isExact: true,
    });
  }

  const metricChild = {
    children: [],
    id: 'af44-b2a649812b33', // TODO: how to generate the id?
    searchObject: { expression },
    type: 'metric',
    uiIndex: 0,
  };

  let root = metricChild;
  const functionsParsed = JSON.parse(functions);
  if (Object.keys(functionsParsed).length) {
    root = Object.keys(functionsParsed)
      .sort((aName, bName) => functionsParsed[bName].index - functionsParsed[aName].index)
      .reduce(
        (result, currFuncName) =>
          currFuncName !== 'new' && functionsParsed[currFuncName]?.functionName
            ? {
                children: [result],
                function: functionsParsed[currFuncName].functionName,
                id: '882f-d2a8f8cadf29',
                parameters: Object.keys(functionsParsed[currFuncName].parameters).map((name) => {
                  const param = functionsParsed[currFuncName].parameters[name];
                  return { name, value: isObject(param) ? param.value : param };
                }),
                type: 'function',
                uiIndex: 0,
              }
            : result,
        metricChild
      );
  }

  const payload = {
    composite: {
      name: {
        auto: true,
        prefix: null,
      },
      displayOnly: true,
      filter: {
        function: sortBy,
        parameters: [
          {
            name: 'Top N',
            value: size,
          },
        ],
        children: [],
        id: '05c6-ae07c72815ca',
        type: 'function',
      },
      expressionTree: {
        root,
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
  size: 500,
});
