import React from 'react';
import FormSelect from '../components/FormField/FormSelect';
import FormSlider from '../components/FormField/FormSlider';
import FormInput from '../components/FormField/FormInput';
import FormSwitch from '../components/FormField/FormSwitch';
import defaults from 'lodash/defaults';
import { AnomalyQuery, ScenarioProps } from '../types';
import { deltaTypesOptions, directionsOptions, sortAnomalyOptions, timeScaleOptions } from '../utils/constants';

const defaultAnomaliesQuery: Partial<AnomalyQuery> = {
  duration: [5],
  score: [5],
  deltaType: 'absolute',
  deltaValue: 5,
  direction: directionsOptions,
  timeScales: [timeScaleOptions[0], timeScaleOptions[1]],
  requestCharts: true,
  includeBaseline: true,
  sortBy: 'score',
  openedOnly: false,
  metrics: []
};

const AnomaliesQueryEditor = (props: ScenarioProps<AnomalyQuery>) => {
  const { metricsList, onFormChange } = props;
  const query = defaults(props.query, defaultAnomaliesQuery);

  return (
    <>
      <div className="gf-form gf-form--grow">
        <FormSelect
          isMulti
          inputWidth={0}
          label={'Measures'}
          tooltip={'Select measures.'}
          value={query.metrics}
          options={metricsList}
          onChange={value => onFormChange('metrics', value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSlider
          disabled={!query.metrics.length}
          inputWidth={0}
          label={'Anomaly Duration'}
          value={query.duration}
          tooltip={'Anomaly Duration'}
          onChange={value => onFormChange('duration', value, true)}
        />
        <FormSlider
          disabled={!query.metrics.length}
          inputWidth={0}
          label={'Anomaly Score'}
          value={query.score}
          tooltip={'Anomaly Score'}
          onChange={value => onFormChange('score', value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          disabled={!query.metrics.length}
          isClearable
          inputWidth={0}
          label={'Anomalies Delta Type'}
          tooltip={'Anomalies Delta Type'}
          value={query.deltaType}
          options={deltaTypesOptions}
          onChange={value => onFormChange('deltaType', value, true)}
        />
        <FormInput
          disabled={!query.metrics.length}
          inputWidth={0}
          label={'Anomalies Delta Value'}
          tooltip={'Anomalies Delta Value'}
          value={query.deltaValue}
          type={'number'}
          onChange={e => onFormChange('deltaValue', e.currentTarget.value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          disabled={!query.metrics.length}
          isClearable
          isMulti
          inputWidth={0}
          label={'Anomalies Time Scale'}
          tooltip={'Select Context'}
          value={query.timeScales}
          options={timeScaleOptions}
          onChange={value => onFormChange('timeScales', value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          disabled={!query.metrics.length}
          inputWidth={0}
          label={'Anomalies Sort Order'}
          tooltip={'Anomalies Sort Order'}
          value={query.sortBy}
          options={sortAnomalyOptions}
          onChange={value => onFormChange('sortBy', value, true)}
        />
        <FormSelect
          disabled={!query.metrics.length}
          isMulti
          inputWidth={0}
          label={'Anomaly Direction'}
          tooltip={'Anomaly Direction'}
          value={query.direction}
          options={directionsOptions}
          onChange={value => onFormChange('direction', value, true)}
        />
      </div>
      <div className="gf-form gf-form--grow">
        <FormSwitch
          disabled={!query.metrics.length}
          label={'Open Anomalies only'}
          tooltip={'Open Anomalies only'}
          value={query.openedOnly}
          onChange={e => onFormChange('openedOnly', e.currentTarget.checked, true)}
        />
        <FormSwitch
          labelWidth={0}
          disabled={!query.metrics.length}
          label={'Request Charts Data'}
          tooltip={'Show Anomalies Charts or Anomalies List'}
          value={query.requestCharts}
          onChange={e => onFormChange('requestCharts', e.currentTarget.checked, true)}
        />
        <FormSwitch
          labelWidth={0}
          disabled={!query.metrics.length || !query.requestCharts}
          label={'Include Baseline'}
          tooltip={'Include Baseline'}
          value={query.includeBaseline}
          onChange={e => onFormChange('includeBaseline', e.currentTarget.checked, true)}
        />
      </div>
    </>
  );
};

export default AnomaliesQueryEditor;
