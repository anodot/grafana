//@ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import FormSelect from '../components/FormField/FormSelect';
import defaults from 'lodash/defaults';
import { MetricsQuery, ScenarioProps } from '../types';
import difference from 'lodash/difference';
import FormSwitch from '../components/FormField/FormSwitch';
import KeyValueControl from '../components/KeyValueControl';
import FunctionsControl from '../components/FunctionsControl';
import { functionsMeta } from './searchFunctionsMeta';

export const defaultMetricsCompositeQuery: Partial<MetricsQuery> = {
  baseLine: true,
  showMultiline: true,
  dimensions: [],
  functions: {},
};

const MetricsCompositeQueryEditor = (props: ScenarioProps<MetricsQuery>) => {
  const { onChange, onFormChange, datasource, metricsList } = props;
  const query = defaults(props.query, defaultMetricsCompositeQuery);
  const [propertiesOptions, setPropertiesOptions] = useState([]);
  const [availableOptions, setAvailableOptions] = useState([]);

  const getValues = useCallback(name => datasource.getMetricsPropVal(query.metricName, name), [query.metricName]);

  useEffect(() => {
    /* Request available propertyNames by selected metrics */
    if (query.metricName) {
      // Reset previous selections:
      onChange({ ...query, dimensions: defaultMetricsCompositeQuery.dimensions });
      datasource.getPropertiesDict(query.metricName).then(({ properties, propertyValues }) => {
        setPropertiesOptions(properties);
      });
    }
  }, [query.metricName]);

  useEffect(() => {
    /* Reduce already selected propertyNames from available properties */
    if (propertiesOptions) {
      let choseOptions = query.dimensions.map(d => d.key); // options were already chose and are not available anymore
      const availableOptions = difference(propertiesOptions, choseOptions).map(value => ({ label: value, value }));
      setAvailableOptions(availableOptions);
    }
  }, [propertiesOptions, query.dimensions]);

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isClearable
            inputWidth={0}
            label={'Measure'}
            tooltip={'Select a metric.'}
            value={query.metricName}
            options={metricsList}
            onChange={value => onFormChange('metricName', value, true)}
          />
        </div>
        <div className="gf-form">
          <FormSwitch
            labelWidth={9}
            label={'Include baseline'}
            tooltip={'Include baseline'}
            value={query.baseLine}
            onChange={e => onFormChange('baseLine', e?.currentTarget?.checked, true)}
          />
          <FormSwitch
            label={'Multiline Mode'}
            labelWidth={9}
            tooltip={'Shows all metrics on the single chart together'}
            value={query.showMultiline}
            onChange={e => onFormChange('showMultiline', e?.currentTarget?.checked, true)}
          />
        </div>
      </div>
      {query.metricName && (
        <div style={{ marginBottom: 4 }}>
          <FunctionsControl
            functionsConfigs={functionsMeta}
            key={`function-${query.metricName}`}
            selectedFunctions={query.functions}
            onChangeFunctions={newFunctions => onFormChange('functions', newFunctions, !('new' in newFunctions))}
            groupByPropertiesList={propertiesOptions}
          />
        </div>
      )}
      {query.metricName && (
        <div style={{ marginBottom: 4 }}>
          <KeyValueControl
            key={query.metricName}
            dimensionsQuery={query.dimensions}
            onChangeQuery={value => onFormChange('dimensions', value, true)}
            availableDimensionsNames={availableOptions}
            getValues={getValues}
          />
        </div>
      )}
    </>
  );
};

export default MetricsCompositeQueryEditor;
