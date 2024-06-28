import React, { useCallback, useEffect, useState } from 'react';
import defaults from 'lodash/defaults';
import { FlatObject, MetricsQuery, ScenarioProps } from '../types';
import difference from 'lodash/difference';
import FormSwitch from '../components/FormField/FormSwitch';
import DimensionsRows from '../components/KeyValueControl';
import FunctionsControl from '../components/Functions';
import { functionsMeta } from './searchFunctionsMeta';
import MetricSearchField from '../components/MetricSearchField';
import { addLabel } from '../utils/helpers';
import FormSelect from '../components/FormField/FormSelect';
import FormInput from '../components/FormField/FormInput';
import { metricsSortingOptions } from '../utils/constants';
import { SelectableValue } from '@grafana/data';

const maxSize = 20;

export const defaultMetricsCompositeQuery: Partial<MetricsQuery> = {
  baseLine: true,
  showMultiline: true,
  addQuery: true,
  dimensions: '[]',
  functions: '{}',
  metricName: undefined,
  sortBy: 'alphanumeric',
  size: 10,
  applyVariables: false,
};

const MetricsCompositeQueryEditor: React.FC<ScenarioProps<MetricsQuery>> = (props) => {
  const { onFormChange, datasource } = props;
  const query = defaults(props.query, defaultMetricsCompositeQuery);
  const [propertiesOptions, setPropertiesOptions] = useState([]);
  const [availableOptions, setAvailableOptions] = useState([] as SelectableValue[]);
  const [isPristine, setIsPristine] = useState(true);
  const getMetricsOptions = datasource.getMetricsOptions.bind(datasource);

  useEffect(() => {
    setIsPristine(false);
    props.onRunQuery();
  }, []);

  useEffect(() => {
    /** Request available propertyNames by selected metrics */
    /* Reset previous selections: */
    !isPristine && onFormChange('dimensions', defaultMetricsCompositeQuery.dimensions, false);
    datasource.getPropertiesDict(query.metricName).then(({ properties }) => {
      setPropertiesOptions(properties);
      /* save it in Query to be able to validate dashboardVarsDimensions in datasource */
      onFormChange('dimensionsOptions', properties, false);
    });
  }, [query.metricName]);

  useEffect(() => {
    /** Reduce already selected propertyNames from available properties */
    if (propertiesOptions) {
      let choseOptions = JSON.parse(query.dimensions).map((d) => d.key); // options were already chose and are not available anymore
      const availableOptions = difference(propertiesOptions, choseOptions).map((value) => ({ label: value, value }));
      setAvailableOptions(availableOptions);
    }
  }, [propertiesOptions, query.dimensions]);

  const getValues = useCallback((name) => datasource.getMetricsPropVal(query.metricName, name), [query.metricName]);

  // TODO: Do ve have availableOptions for empty Measure?
  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <MetricSearchField
            placeholder={'Any Measure'}
            isClearable
            getMetricsOptions={getMetricsOptions}
            value={query.metricName && addLabel(query.metricName)}
            onChange={(value) => onFormChange('metricName', value, true)}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <FormSelect
            label={'Sort by'}
            inputWidth={0}
            tooltip={'Select sorting function'}
            value={query.sortBy}
            options={metricsSortingOptions}
            onChange={({ value }) => onFormChange('sortBy', value, true)}
          />
        </div>
      </div>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSwitch
            labelWidth={14}
            label={'Include baseline'}
            tooltip={'Include baseline'}
            value={!query.showMultiline && query.baseLine}
            onChange={(e) => onFormChange('baseLine', e?.currentTarget?.checked, true)}
          />
          <FormSwitch
            label={'Multiline'}
            labelWidth={6}
            tooltip={'Shows all metrics on the single chart together'}
            value={query.showMultiline}
            onChange={(e) => onFormChange('showMultiline', e?.currentTarget?.checked, true)}
          />
          <FormSwitch
            labelWidth={0}
            label={'Data Frame'}
            tooltip={
              'Return grafana data frame https://grafana.com/docs/grafana/latest/developers/plugins/working-with-data-frames/'
            }
            value={query.addQuery}
            onChange={(e) => onFormChange('addQuery', e.currentTarget.checked, true)}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <FormInput
            inputWidth={0}
            tooltip={`Maximum amount of the requested charts (1 - ${maxSize})`}
            type={'number'}
            label={'Limit'}
            value={query.size}
            onChange={({ target: { value } }) => onFormChange('size', Math.max(1, Math.min(maxSize, value)), true)}
          />
          <FormSwitch
            labelWidth={0}
            label={'Apply variables'}
            tooltip={"Apply dashboard's dimension variables"}
            value={Boolean(query.applyVariables)}
            onChange={(e) => onFormChange('applyVariables', e.currentTarget.checked, true)}
          />
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <DimensionsRows
          key={query.metricName}
          dimensionsQuery={JSON.parse(query.dimensions)}
          onChangeDimensions={(value) => onFormChange('dimensions', JSON.stringify(value), true)}
          availableDimensionsNames={availableOptions}
          getValues={getValues}
          withNotControl
        />
      </div>
      {query.metricName && (
        <div style={{ marginBottom: 4 }}>
          <FunctionsControl
            functionsConfigs={functionsMeta}
            key={`function-${query.metricName}`}
            selectedFunctions={JSON.parse(query.functions)}
            onChangeFunctions={(newFunctions: FlatObject) =>
              onFormChange('functions', JSON.stringify(newFunctions), !('new' in newFunctions))
            }
            groupByPropertiesList={propertiesOptions}
            getMetricsOptions={getMetricsOptions}
          />
        </div>
      )}
    </>
  );
};

export default MetricsCompositeQueryEditor;
