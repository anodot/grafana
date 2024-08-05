import { TimeRange } from '@grafana/data';
import { MeasuresTypesEnum, MeasureWithComposites, TimeFilter } from '../types';
import { isNull } from 'lodash';

export const getPluoral = (n, base, suffix = 's') => base + (n === 1 ? '' : suffix);

export const formatDate = (secs, format = 'MM/DD/YYYY') => {
  const addZero = (v) => ('0' + v).slice(-2);
  let d = new Date(secs * 1000);
  const hours = `${addZero(d.getHours())}:${addZero(d.getMinutes())}`;
  const date = format
    .replace('DD', addZero(d.getDate()))
    .replace('MM', addZero(d.getMonth() + 1))
    .replace('YYYY', addZero(d.getFullYear() - 100));
  return (checkIsToday(secs * 1000) ? 'Today ' : `${date} `) + hours;
};

export const checkIsToday = (mSeconds) => {
  return new Date().getTime() - mSeconds < 86400000 && new Date().getDate() === new Date(mSeconds).getDate();
};

export const formatDuration = (seconds, shortPostfix = false) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${shortPostfix ? 'm' : getPluoral(minutes, 'minute')}`;
  }
  const roundedHours = Math.round(minutes / 30) / 2;
  if (roundedHours > 24) {
    const days = Math.round(roundedHours / 24) / 2;
    return `${days} ${shortPostfix ? 'd' : getPluoral(days, 'day')}`;
  }
  return `${roundedHours} ${shortPostfix ? 'h' : getPluoral(roundedHours, 'hour')}`;
};

export function readTime(time: TimeRange, startName = 'startDate', endName = 'endDate'): Partial<TimeFilter> {
  const from = Math.floor(new Date(time!.from.valueOf()).getTime() / 1000);
  const to = Math.floor(new Date(time!.to.valueOf()).getTime() / 1000);
  return {
    [startName]: from,
    [endName]: to,
  };
}

export const arrayToOptions = (arr: any[] = [], key?, withExtension = false) => {
  const options = arr?.map?.((item) => {
    const value = key ? item[key] : item;
    const extension = withExtension ? item : {};
    return { ...extension, label: value, value };
  });
  if (!options) {
    console.error('arrayToOptions got error', arr);
    return [];
  }
  return options;
};

export const addLabel = (value) => (value?.label ? value : { label: value, value });

export function getDateRange(days, startFlag) {
  if (isNaN(days)) {
    if (days?.length) {
      // custom case when calendar gives us an array [from, to], not amount of days
      const [fromDate, toDate] = days.map((d) => new Date(d).getTime() / 1000);
      return startFlag ? { startDate: fromDate, endDate: toDate } : { fromDate, toDate };
    }
    return {}; // no values
  } else {
    const SECS_IN_DAY = 86400; // 24 * 60 * 60
    const toDate = Math.floor(Date.now() / 1000);
    const fromDate = toDate - days * SECS_IN_DAY;
    return startFlag ? { startDate: fromDate, endDate: toDate } : { fromDate, toDate };
  }
}

export function getQueryParamsUrl(params, url = '') {
  const format = (str, key) => {
    if (params[key] !== undefined && !isNull(params[key])) {
      return str + (str === url ? '?' : '&') + `${key}=${String(params[key])}`;
    }
    return str;
  };

  return Object.keys(params).reduce(format, url);
}

export function getQ(measures: MeasureWithComposites[], filters = [], stringify, notOperator = false) {
  const expression: any[] = [];
  measures.forEach((measure) => {
    if (measure?.type === MeasuresTypesEnum.MEASURES) {
      expression.push({
        type: 'property',
        key: 'what',
        value: (notOperator ? '!' : '') + measure.value,
        isExact: !notOperator,
      });
    }
    if (measure?.type === MeasuresTypesEnum.COMPOSITES) {
      expression.push({
        type: 'origin',
        originType: 'Composite',
        key: 'originId',
        value: (notOperator ? '!' : '') + measure.originId,
        isExact: !notOperator,
      });
    }
  });
  const q = {
    expression: [...expression, ...filters],
  };
  return stringify ? JSON.stringify(q) : q;
}

export const tryJSONParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};
function randomHex(size: number) {
  return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}
export function generateAnodotUID() {
  const part1 = randomHex(4); // 4 characters
  const part2 = randomHex(12); // 12 characters

  return `${part1}-${part2}`;
}
