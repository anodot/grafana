import { FieldType, MutableDataFrame } from '@grafana/data';
import format from 'date-fns/format';
import { checkIsToday, formatDuration } from '../utils/helpers';
import { scenarios } from '../utils/constants';
import { getAlerts } from '../api';

export function alertsQuery(query, timeInterval, urlBase) {
  return getAlerts(query, timeInterval, urlBase).then(({ alertGroups }) => {
    const flattenAlerts = [].concat(...alertGroups.map(group => group?.alerts));
    const frame = new MutableDataFrame({
      /* TODO: It can be used in native Table panel only, but still needs to be
      configured: add link for title, hide levels column, hide digits from Severity column. How to do that?
       */
      refId: query.refId,
      fields: [
        {
          name: 'Severity',
          type: FieldType.other,
          config: {
            custom: {
              width: 70,
              displayMode: 'color-background',
            },
            color: {
              mode: 'thresholds',
            },
            thresholds: {
              mode: 'absolute',
              steps: [
                // { value: 'critical', color: 'red' },
                // { value: 'high', color: 'blue' },
                // { value: 'medium', color: 'green' },
                // { value: 'low', color: 'purple' },
                { value: 0, color: '#d10f37' },
                { value: 1, color: '#f9771f' },
                { value: 2, color: '#ffbe2f' },
                { value: 3, color: '#41ca5a' },
              ],
            },
          },
          parse: value => {
            switch (value) {
              case 'critical':
                return '0';
              case 'high':
                return 1;
              case 'medium':
                return 2;
              case 'low':
              default:
                return 3;
            }
          },
        },
        {
          name: 'Name',
          type: FieldType.string,
        },
        {
          name: 'Started',
          type: FieldType.string,
          config: {
            custom: {
              width: 70,
            },
          },
        },
        {
          name: 'Duration',
          type: FieldType.string,
          config: {
            custom: {
              width: 90,
            },
          },
        },
        {
          name: 'Score',
          type: FieldType.string,
          config: {
            custom: {
              width: 20,
            },
          },
        },
        { name: 'level', type: FieldType.string },
      ],
    });

    flattenAlerts.forEach((alert, i) => {
      let score;
      if (alert.type === 'anomaly') {
        /* get the score */
        const lastMetric = alert.metrics[alert.metrics.length - 1];
        score = Math.round(Math.max(...lastMetric.intervals.map(i => i.score)) * 100);
      }
      alert.formatted = {
        started: format(new Date(alert.startTime * 1000), checkIsToday(alert.startTime * 1000) ? 'HH:mm' : 'MMM dd'), //formatDate(alert.startTime, 'MM DD'),
        duration: formatDuration(alert.duration, true),
        score,
      };
      frame.add({
        Name: alert.title,
        Started: alert.formatted.started,
        Duration: alert.formatted.duration,
        Score: score,
        level: alert.severity === 'high' ? 'error' : i % 2 ? 'warn' : 'info',
        Severity: alert.severity,
      });
    });

    frame.serieName = scenarios.alerts;
    frame.anodotPayload = {
      alerts: flattenAlerts,
      urlBase,
      query,
    };
    return frame;
  });
}
