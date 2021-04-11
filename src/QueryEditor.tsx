//@ts-nocheck
import defaults from 'lodash/defaults';
import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from '@grafana/ui';
import { EditorQuery, QEditorProps } from './types';
import FormSelect from './components/FormField/FormSelect';
import { scenarios } from './utils/constants';
import AlertsQueryEditor from './Alerts/QueryEditor';
import AnomaliesQueryEditor from './Anomalies/QueryEditor';
import TopologyQueryEditor from './Topology/QueryEditor';
import MetricsComposite from './MetricsComposite/QueryEditor';
import { arrayToOptions } from './utils/helpers';

const scenarioOptions = {
  [scenarios.alerts]: { label: 'Alerts', value: scenarios.alerts },
  [scenarios.anomalies]: { label: 'Anomalies', value: scenarios.anomalies },
  [scenarios.metricsComposite]: { label: 'Metrics', value: scenarios.metricsComposite },
  [scenarios.topology]: { label: 'Topology Map', value: scenarios.topology },
};

const defaultQuery: Partial<EditorQuery> = {
  scenario: scenarios.alerts
};

export const QueryEditor = (props: QEditorProps) => {
  const [metricsList, setMetricsList] = useState([]);
  const [errorAlert, setErrorAlert] = useState('');
  const query = defaults(props.query, defaultQuery);

  useEffect(() => {
    /* Request Metrics Options onMount*/
    props.datasource.getMetricsOptions().then(metrics => {
      if (metrics?.error) {
        setErrorAlert(metrics.error.message);
      } else {
        setMetricsList(arrayToOptions(metrics, 'value'));
      }
    });
  }, []);

  useEffect(() => {
    /* try to run the query immediately after scenario was changed */
    props.onRunQuery();
  }, [query.scenario]);

  const onFormChange = useCallback(
    (key, value, forceRunQuery = false) => {
      const newQuery = { ...query, [key]: value.value ?? value };
      props.onChange(newQuery);
      forceRunQuery && props.onRunQuery();
    },
    [query]
  );

  const editorsProps = {
    ...props,
    onFormChange,
    metricsList,
  };

  let editor;

  switch (query.scenario) {
    case scenarios.alerts:
      editor = <AlertsQueryEditor {...editorsProps} />;
      break;
    case scenarios.anomalies:
      editor = <AnomaliesQueryEditor {...editorsProps} />;
      break;
    case scenarios.topology:
      editor = <TopologyQueryEditor {...editorsProps} />;
      break;
    case scenarios.metricsComposite:
      editor = <MetricsComposite {...editorsProps} />;
      break;
    default:
      editor = null;
  }

  return (
    <div className={'gf-form-group'}>
      <div className={'gf-form'}>
        <FormSelect
          queryKeyword
          inputWidth={0}
          label={'Scenario'}
          tooltip={'Select scenario'}
          value={query.scenario}
          options={Object.values(scenarioOptions)}
          onChange={value => onFormChange('scenario', value)}
        />
      </div>
      {errorAlert && <Alert title={errorAlert} severity={'error'} />}
      {editor}
    </div>
  );
};
