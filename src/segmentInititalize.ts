// @ts-nocheck
import { config } from '@grafana/runtime';
import { uniq } from 'lodash';

export const segmentInitialize = function() {
  var analytics = (window.analytics = window.analytics || []);
  if (!analytics.initialize) {
    if (analytics.invoked) {
      window.console && console.error && console.error('Segment snippet included twice.');
    } else {
      analytics.invoked = !0;
      analytics.methods = [
        'trackSubmit',
        'trackClick',
        'trackLink',
        'trackForm',
        'pageview',
        'identify',
        'reset',
        'group',
        'track',
        'ready',
        'alias',
        'debug',
        'page',
        'once',
        'off',
        'on',
        'addSourceMiddleware',
        'addIntegrationMiddleware',
        'setAnonymousId',
        'addDestinationMiddleware',
      ];
      analytics.factory = function(e) {
        return function() {
          var t = Array.prototype.slice.call(arguments);
          t.unshift(e);
          analytics.push(t);
          return analytics;
        };
      };
      for (var e = 0; e < analytics.methods.length; e++) {
        var key = analytics.methods[e];
        analytics[key] = analytics.factory(key);
      }
      analytics.load = function(key, e) {
        var t = document.createElement('script');
        t.type = 'text/javascript';
        t.async = !0;
        t.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';
        var n = document.getElementsByTagName('script')[0];
        n.parentNode.insertBefore(t, n);
        analytics._loadOptions = e;
      };
      analytics._writeKey = 'vNH4nCHmtcH4rtTRp6nCKaC6yDxWMOyH';
      analytics.SNIPPET_VERSION = '4.13.2';
      analytics.load('vNH4nCHmtcH4rtTRp6nCKaC6yDxWMOyH');
      analytics.page();
    }
  }
};

const { buildInfo, panels, datasources, theme } = config;
export const getAnalyticsData = instanceSettings => {
  const dsVersion = instanceSettings.meta.info.version;
  const usedUrl = instanceSettings.jsonData.url;
  return {
    ref: 'grafana',
    grafanaVersion: buildInfo.version,
    theme: theme.type,
    datasourceVersion: dsVersion,
    usedUrl,
    userAgent: window?.navigator?.userAgent,
    installedDataSources: JSON.stringify(
      uniq(
        Object.values(datasources)
          .filter(ds => ds.id)
          .map(
            ({
              meta: {
                id,
                info: { author, version },
              },
            }) => id + (/\d/.test(version) ? ` v.${version}` : '')
          )
      )
    ),
    installedPanels: JSON.stringify(
      uniq(
        Object.values(panels).map(
          ({ id, info: { author, version } }) => id + (/\d/.test(version) ? ` v.${version}` : '')
        )
      )
    ),
  };
};
