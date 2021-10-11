import { TimeRange } from '@grafana/data/types/time';
import { TimeFilter } from '../types';

export const getPluoral = (n, base, suffix = 's') => base + (n === 1 ? '' : suffix);

export const formatDate = (secs, format = 'MM/DD/YYYY') => {
  const addZero = v => ('0' + v).slice(-2);
  let d = new Date(secs * 1000);
  const hours = `${addZero(d.getHours())}:${addZero(d.getMinutes())}`;
  const date = format
    .replace('DD', addZero(d.getDate()))
    .replace('MM', addZero(d.getMonth() + 1))
    .replace('YYYY', addZero(d.getFullYear() - 100));
  return (checkIsToday(secs * 1000) ? 'Today ' : `${date} `) + hours;
};

export const checkIsToday = mSeconds => {
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

export const arrayToOptions = (arr: any[] = [], key?) => {
  const options = arr?.map?.(item => {
    const value = key ? item[key] : item;
    return { label: value, value };
  });
  if (!options) {
    console.error('arrayToOptions got error', arr);
    return [];
  }
  return options;
};

export const addLabel = value => (value?.label ? value : { label: value, value });

export function getDateRange(days, startFlag) {
  if (isNaN(days)) {
    if (days?.length) {
      // custom case when calendar gives us an array [from, to], not amount of days
      const [fromDate, toDate] = days.map(d => new Date(d).getTime() / 1000);
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
    if (params[key]) {
      return str + (str === url ? '?' : '&') + `${key}=${params[key]}`;
    }
    return str;
  };

  return Object.keys(params).reduce(format, url);
}

export function getQ(metric, filters = [], stringify, notOperator = false) {
  const expression: any[] = [];
  if (metric && metric !== '*') {
    expression.push({
      type: 'property',
      key: 'what',
      value: (notOperator ? '!' : '') + metric,
      isExact: !notOperator,
    });
  }
  const q = {
    expression: [...expression, ...filters],
  };
  return stringify ? JSON.stringify(q) : q;
}
