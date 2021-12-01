export const urlBase = 'https://app.anodot.com';
export const urlApiPostfix = '/api/v2/';
export const urlGrafanaHelp = 'https://www.anodot.com/integration/grafana/';

export const scenarios = {
  topology: 'topology',
  metrics: 'metrics',
  anomalies: 'anomalies',
  alerts: 'alerts',
  metricsComposite: 'metricsComposite',
};

export const timeFormat = 'MM/DD/YYYY h:mm a';
export const splitSign = '] + [';
export const durations = {
  '1 minute': 1,
  '5 minutes': 5,
  '15 minutes': 15,
  '30 minutes': 30,
  '1 hour': 60,
  '2 hours': 120,
  '5 hours': 300,
};

export const timeIntervals = {
  'Last 15 mins': 0.01,
  'Last 30 mins': 0.021,
  'Last Hour': 0.0417,
  'Last Day': 1,
  'Last Week': 7,
  'Last Month': 30,
  'Last Year': 365,
  Custom: 'Custom',
};

export const timeScaleOptions = [
  /* meta: [ duration value, duration units, resolution, sorting order ] */
  { label: '1 Minute', value: '1 Minute', meta: [1, 'minutes', 'short', 0] },
  { label: '5 Minutes', value: '5 Minutes', meta: [5, 'minutes', 'medium', 1] },
  { label: '1 Hour', value: '1 Hour', meta: [1, 'hours', 'long', 2] },
  { label: '1 Day', value: '1 Day', meta: [1, 'days', 'longlong', 3] },
  { label: '1 Week', value: '1 Week', meta: [7, 'days', 'weekly', 4] },
];

export const directionsOptions = [
  { label: 'Up', value: 'up' },
  { label: 'Down', value: 'down' },
];

export const deltaTypesOptions = [
  { label: 'Absolute', value: 'absolute' },
  { label: 'Percentage', value: 'percentage' },
];

export const sortAnomalyOptions = [
  { label: 'Score', value: 'score' },
  { label: 'Start Date', value: 'startDate' },
  { label: 'Absolute Delta', value: 'delta' },
];

export const severityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];
export const alertTypesOptions = [
  { label: 'Anomaly', value: 'anomaly' },
  { label: 'Static', value: 'static' },
  { label: 'No Data', value: 'noData' },
];

export const alertAcknowledgeOptions = [
  { label: 'All', value: '' },
  { label: 'Acknowledged', value: 'ACK' },
  { label: 'Not Acknowledged', value: 'NOACK' },
];

export const requestStrategies = {
  all: 'requestAll',
  anomaliesOnly: 'requestAnomaliesOnly',
  eventsOnly: 'requestEventsOnly',
  noRequests: 'noRequests',
};

export const metricsSortingOptions = [
  { label: 'Alphanumeric', value: 'alphanumeric' },
  { label: 'Highest Average', value: 'highestAverage' },
  { label: 'Highest Current', value: 'highestCurrent' },
  { label: 'Highest Max', value: 'highestMax' },
  { label: 'Lowest Average', value: 'lowestAverage' },
  { label: 'Lowest Current', value: 'lowestCurrent' },
  { label: 'Lowest Min', value: 'lowestMin' },
  { label: 'Most Deviant', value: 'mostDeviant' },
];
