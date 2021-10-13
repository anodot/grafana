import React, { useEffect } from 'react';
import FormSelect from '../components/FormField/FormSelect';
import FormSlider from '../components/FormField/FormSlider';
import FormInput from '../components/FormField/FormInput';
import FormSwitch from '../components/FormField/FormSwitch';
import MetricSearchField from '../components/MetricSearchField';
import defaults from 'lodash/defaults';
import { AnomalyQuery, ScenarioProps } from '../types';
import { deltaTypesOptions, directionsOptions, sortAnomalyOptions, timeScaleOptions } from '../utils/constants';

const maxSize = 20;

const defaultAnomaliesQuery: Partial<AnomalyQuery> = {
  duration: [1],
  score: [5],
  deltaType: 'absolute',
  deltaValue: 5,
  direction: directionsOptions,
  timeScales: [timeScaleOptions[0], timeScaleOptions[1]],
  requestCharts: true,
  includeBaseline: true,
  sortBy: 'score',
  openedOnly: false,
  metrics: [],
  notOperator: false,
  size: 10,
  durationStep: 1,
  durationUnit: 'minutes',
};

const AnomaliesQueryEditor = (props: ScenarioProps<AnomalyQuery>) => {
  const { datasource, onFormChange } = props;
  const query = defaults(props.query, defaultAnomaliesQuery);
  const isSpecificMetricSelected = query.metrics?.length > 0;
  const durationLabel = `Duration (${query.durationStep > 1 ? query.durationStep + ' ' : ''}${
    query.durationUnit || ''
  })`;

  useEffect(() => {
    props.onRunQuery();
  }, []);

  return (
    <>
      <div className="gf-form gf-form--grow">
        <MetricSearchField
          isMulti
          getMetricsOptions={datasource.getMetricsOptions.bind(datasource)}
          value={query.metrics}
          onChange={(value) => onFormChange('metrics', value, true)}
          placeholder={'All measures'}
          notOptions={{
            notCheckboxDisabled: !isSpecificMetricSelected,
            showNotCheckbox: true,
            notCheckboxValue: isSpecificMetricSelected && query.notOperator,
            onNotChange: (e) => onFormChange('notOperator', e.currentTarget.checked, true),
          }}
        />
      </div>
      <div className={'gf-form'}>
        <FormSlider
          min={query.durationStep}
          inputWidth={0}
          label={durationLabel}
          value={query.duration}
          tooltip={'Anomaly Duration'}
          onAfterChange={(value) => onFormChange('duration', value, true)}
        />
        <FormSlider
          inputWidth={0}
          label={'Score'}
          value={query.score}
          tooltip={'Anomaly Score'}
          onAfterChange={(value) => onFormChange('score', value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          isClearable
          inputWidth={0}
          label={'Delta Type'}
          tooltip={'Anomalies Delta Type'}
          value={query.deltaType}
          options={deltaTypesOptions}
          onChange={(value) => onFormChange('deltaType', value, true)}
        />
        <FormInput
          inputWidth={0}
          label={'Delta Value'}
          tooltip={'Anomalies Delta Value'}
          value={query.deltaValue}
          type={'number'}
          onChange={(e) => onFormChange('deltaValue', e.currentTarget.value, true)}
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          isClearable
          isMulti
          inputWidth={0}
          label={'Time Scale'}
          tooltip={'Anomaly Time Scale'}
          value={query.timeScales}
          options={timeScaleOptions}
          onChange={(value) => {
            const smallestTimescale = value.sort((a, b) => a.meta[3] - b.meta[3])[0];
            const joinedChanges = {
              timeScales: value,
              // duration: [smallestTimescale.meta[0]],
              durationStep: smallestTimescale?.meta[0] || defaultAnomaliesQuery.durationStep,
              durationUnit: smallestTimescale?.meta[1] || defaultAnomaliesQuery.durationUnit,
            };
            onFormChange(joinedChanges, null, true);
          }}
          required
        />
      </div>
      <div className={'gf-form'}>
        <FormSelect
          isMulti
          inputWidth={0}
          label={'Direction'}
          tooltip={'Anomaly Direction'}
          value={query.direction}
          options={directionsOptions}
          onChange={(value) => onFormChange('direction', value, true)}
          required
        />
        <FormSelect
          inputWidth={0}
          label={'Sort by'}
          tooltip={'Anomalies Sort Order'}
          value={query.sortBy}
          options={sortAnomalyOptions}
          onChange={(value) => onFormChange('sortBy', value, true)}
        />
      </div>
      <div className="gf-form gf-form--grow">
        <FormSwitch
          label={'Open only'}
          tooltip={'Open Anomalies only'}
          value={query.openedOnly}
          onChange={(e) => onFormChange('openedOnly', e.currentTarget.checked, true)}
        />
        <FormSwitch
          labelWidth={0}
          label={'Request Charts Data'}
          tooltip={'Show Anomalies Charts or Anomalies List'}
          value={query.requestCharts}
          onChange={(e) => onFormChange('requestCharts', e.currentTarget.checked, true)}
        />
        <FormSwitch
          labelWidth={0}
          disabled={!query.requestCharts}
          label={'Include Baseline'}
          tooltip={'Include Baseline'}
          value={query.includeBaseline}
          onChange={(e) => onFormChange('includeBaseline', e.currentTarget.checked, true)}
        />
        <FormInput
          labelWidth={4}
          inputWidth={0}
          label={'Size'}
          tooltip={`Maximum amount of the requested charts (1 - ${maxSize})`}
          min={1}
          max={maxSize}
          type={'number'}
          value={query.size}
          onChange={({ target: { value } }) => onFormChange('size', Math.max(1, Math.min(maxSize, value)), true)}
        />
      </div>
    </>
  );
};

export default AnomaliesQueryEditor;
