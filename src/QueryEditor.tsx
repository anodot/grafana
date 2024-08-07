import defaults from 'lodash/defaults';
import React, { useCallback } from 'react';
import {
  AlertsQuery,
  AnomalyQuery,
  MetricsQuery,
  TopologyQuery,
  EditorQuery,
  QEditorProps,
  ScenarioProps,
} from './types';
import FormSelect from './components/FormField/FormSelect';
import { scenarios, dataQueryDefaultKeys } from './utils/constants';
import AlertsQueryEditor from './Alerts/QueryEditor';
import AnomaliesQueryEditor from './Anomalies/QueryEditor';
import TopologyQueryEditor from './Topology/QueryEditor';
import MetricsComposite from './MetricsComposite/QueryEditor';
import pick from 'lodash/pick';
import './ds-styles.css';
import { DataQuery } from '@grafana/data';

const scenarioOptions = {
  [scenarios.alerts]: { label: 'Alerts', value: scenarios.alerts },
  [scenarios.anomalies]: { label: 'Anomalies', value: scenarios.anomalies },
  [scenarios.metricsComposite]: { label: 'Metrics', value: scenarios.metricsComposite },
  [scenarios.topology]: { label: 'Topology Map', value: scenarios.topology },
};

const defaultQuery: Partial<EditorQuery> = {
  scenario: scenarios.alerts,
};

export const QueryEditor = (props: QEditorProps) => {
  const query = defaults(props.query, defaultQuery);

  const onFormChange = useCallback(
    (key, value, forceRunQuery = false) => {
      let newQuery;
      if (typeof key === 'object') {
        newQuery = { ...query, ...key };
      }
      if (typeof key === 'string') {
        newQuery = { ...query, [key]: value?.value ?? value ?? '' };
      }
      props.onChange(newQuery);
      forceRunQuery && props.onRunQuery();
    },
    [query]
  );

  const onScenarioChange = useCallback(
    (scenario) => {
      /* reset query to empty object */
      props.onChange({ scenario: scenario.value, ...(pick(query, dataQueryDefaultKeys) as DataQuery) });
    },
    [query]
  );

  const editorsProps = {
    ...props,
    onFormChange,
  };

  let editor;

  switch (query.scenario) {
    case scenarios.alerts:
      editor = <AlertsQueryEditor {...(editorsProps as ScenarioProps<AlertsQuery>)} />;
      break;
    case scenarios.anomalies:
      editor = <AnomaliesQueryEditor {...(editorsProps as ScenarioProps<AnomalyQuery>)} />;
      break;
    case scenarios.topology:
      editor = <TopologyQueryEditor {...(editorsProps as ScenarioProps<TopologyQuery>)} />;
      break;
    case scenarios.metricsComposite:
      editor = <MetricsComposite {...(editorsProps as ScenarioProps<MetricsQuery>)} />;
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
          onChange={onScenarioChange}
          isOptionDisabled={(({ value }) => value === query.scenario) as () => boolean}
        />
      </div>
      {editor}
    </div>
  );
};
