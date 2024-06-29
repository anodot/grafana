// @ts-nocheck
import { FunctionsNamesEnum } from '../components/Functions/searchFunctionsMeta';
import { RatioParams } from '../components/Functions/RatioPairFunc';
import isObject from 'lodash/isObject';
import { getQueryParamsUrl } from './helpers';
import { PairsParams } from '../components/Functions/PairsFunc';

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
    maxDataPoints: 750,
    schemaType: 'dashboardsV2',
    resolution: '',
    size: size,
    startBucketMode: true,
  };

  const expression = dimensions.map((d) => ({
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

  const firstMetricChild = {
    children: [],
    id: 'af44-b2a649812b33', // TODO: how to generate the id?
    searchObject: { expression },
    type: 'metric',
    uiIndex: 0,
  };

  let root = firstMetricChild;
  const functionsParsed = JSON.parse(functions);
  const isRatioPairs = !!functionsParsed[FunctionsNamesEnum.RATIO_PAIRS];
  const isPairs = !!functionsParsed[FunctionsNamesEnum.PAIRS];
  if (isRatioPairs) {
    const ratioFunc = { ...functionsParsed[FunctionsNamesEnum.RATIO_PAIRS] };
    root = getRatioPairsRoot(firstMetricChild, ratioFunc) || root;
  } else if (isPairs) {
    const func = { ...functionsParsed[FunctionsNamesEnum.PAIRS] };
    root = getPairsRoot(firstMetricChild, func) || root;
  } else if (Object.keys(functionsParsed)?.length) {
    root = Object.keys(functionsParsed)
      .sort((aName, bName) => functionsParsed[bName].index - functionsParsed[aName].index)
      .reduce((acc, currFuncName) => {
        const func = functionsParsed[currFuncName];
        if (currFuncName === 'new' || !func?.functionName) {
          return acc;
        }
        const result = {
          children: Array.isArray(acc) ? acc : [acc],
          function: func.functionName,
          id: '882f-d2a8f8cadf29',
          parameters: Object.keys(func.parameters).map((name) => {
            const param = func.parameters[name];
            return { name, value: isObject(param) ? param.value : param };
          }),
          type: 'function',
        };
        return result;
      }, root);
  }

  const payload = {
    composite: {
      name: {
        auto: true,
        prefix: null,
      },
      displayOnly: true,
      excludeComposites: isRatioPairs ? true : undefined,
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
      scalarTransforms: isRatioPairs
        ? null
        : [
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

function getRatioPairsRoot(firstMetricChild, ratioFunc) {
  const { divisorGroupBy, divisorMeasure, divisorAggregation, dividentGroupBy, dividentAggregation } =
    ratioFunc.parameters as RatioParams;

  if (
    dividentGroupBy &&
    divisorGroupBy &&
    [divisorMeasure, divisorAggregation, dividentAggregation].every((d) => d.value)
  ) {
    const dividentParams = [
      { name: 'Aggregation', value: dividentAggregation.value },
      { name: 'Group By', value: dividentGroupBy },
    ];
    const dividentWithParams = {
      children: [firstMetricChild],
      function: 'groupBy',
      id: `882f-d2a8f8cadf39`,
      parameters: dividentParams,
      type: 'function',
    };
    const divisorParams = [
      { name: 'Aggregation', value: divisorAggregation.value },
      { name: 'Group By', value: divisorGroupBy },
    ];
    const divisorChild = {
      children: [],
      id: 'af66-b2a649812b33',
      searchObject: {
        expression: [
          {
            key: 'what',
            value: divisorMeasure.value,
            type: 'property',
            isExact: true,
          },
        ],
      },
      type: 'metric',
      uiIndex: 0,
    };
    const divisorWithParams = {
      children: [divisorChild],
      function: 'groupBy',
      id: `882f-d2a8f8cadf49`,
      parameters: divisorParams,
      type: 'function',
    };
    return {
      children: [dividentWithParams, divisorWithParams],
      function: FunctionsNamesEnum.RATIO_PAIRS,
      id: '662f-d2a8f8cadf29',
      parameters: [],
      type: 'function',
    };
  }
  return;
}
function getPairsRoot(firstMetricChild, func) {
  const { operation, secondGroupBy, secondMeasure, secondAggregation, firstGroupBy, firstAggregation } =
    func.parameters as PairsParams;

  if (firstGroupBy && secondGroupBy && [secondMeasure, secondAggregation, firstAggregation].every((d) => d.value)) {
    const firstParams = [
      { name: 'Aggregation', value: firstAggregation.value },
      { name: 'Group By', value: firstGroupBy },
    ];
    const firstWithParams = {
      children: [firstMetricChild],
      function: 'groupBy',
      id: `882f-d2a8f8cadf39`,
      parameters: firstParams,
      type: 'function',
    };
    const secondParams = [
      { name: 'Aggregation', value: secondAggregation.value },
      { name: 'Group By', value: secondGroupBy },
    ];
    const secondChild = {
      children: [],
      id: 'af66-b2a649812b33',
      searchObject: {
        expression: [
          {
            key: 'what',
            value: secondMeasure.value,
            type: 'property',
            isExact: true,
          },
        ],
      },
      type: 'metric',
      uiIndex: 0,
    };
    const secondWithParams = {
      children: [secondChild],
      function: 'groupBy',
      id: `882f-d2a8f8cadf49`,
      parameters: secondParams,
      type: 'function',
    };
    return {
      children: [firstWithParams, secondWithParams],
      function: FunctionsNamesEnum.PAIRS,
      id: '662f-d2a8f8cadf29',
      parameters: [{ name: 'Operation', value: operation.value }],
      type: 'function',
    };
  }
  return;
}
