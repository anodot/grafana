//@ts-nocheck
import { FieldType, MutableDataFrame } from '@grafana/data';
import format from 'date-fns/format';
import { checkIsToday, formatDuration } from '../utils/helpers';
import { scenarios } from '../utils/constants';
import { getAlerts } from '../api';

export function alertsQuery(query, datasource) {
  const { urlBase } = datasource;

  return getAlerts(query, datasource).then((result) => {
    const { alertGroups, alerts = [] } = result;
    const flattenAlerts = alertGroups ? [].concat(...alertGroups?.map((group) => group?.alerts)) : alerts;
    const frame = new MutableDataFrame({
      /* TODO: It can be used in native Table panel only, but still needs to be
        configured: add link for title, hide levels column, hide digits from Severity column. How to do that?
       */
      refId: query.refId,
      name: `${query.refId}-anodot-${scenarios.alerts}`,
      meta: { type: 'timeseries-wide', preferredVisualisationType: 'table' },
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
                { value: 0, color: '#d10f37' },
                { value: 1, color: '#f9771f' },
                { value: 2, color: '#ffbe2f' },
                { value: 3, color: '#41ca5a' },
              ],
            },
          },
          parse: (value) => {
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
          name: 'time',
          type: FieldType.time,
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

    flattenAlerts.forEach((alert) => {
      let score;
      // if (alert?.type?.toLowerCase() === 'anomaly') {
      //   /* get the score - TODO: no metrics in last API update? */
      //   const lastMetric = alert.metrics[alert.metrics.length - 1];
      //   score = Math.round(Math.max(...lastMetric.intervals?.map((i) => i.score)) * 100);
      // }
      alert.formatted = {
        started: format(new Date(alert.startTime * 1000), checkIsToday(alert.startTime * 1000) ? 'HH:mm' : 'MMM dd'), //formatDate(alert.startTime, 'MM DD'),
        duration: formatDuration(alert.duration, true),
        score,
      };
      frame.add({
        time: alert.startTime * 1000,
        Name: alert.title,
        Started: alert.formatted.started,
        Duration: alert.formatted.duration,
        Score: score,
        level: ['high', 'critical'].includes(alert.severity) ? 'error' : alert.severity === 'medium' ? 'warn' : 'info',
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
