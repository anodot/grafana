//@ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import defaults from 'lodash/defaults';
import { MetricsQuery, ScenarioProps } from '../types';
import difference from 'lodash/difference';
import FormSwitch from '../components/FormField/FormSwitch';
import KeyValueControl from '../components/KeyValueControl';
import FunctionsControl from '../components/FunctionsControl';
import { functionsMeta } from './searchFunctionsMeta';
import MetricSearchField from '../components/MetricSearchField';
import { addLabel } from '../utils/helpers';

export const defaultMetricsCompositeQuery: Partial<MetricsQuery> = {
  baseLine: true,
  showMultiline: true,
  dimensions: [],
  functions: {},
  metricName: undefined,
};

const MetricsCompositeQueryEditor = (props: ScenarioProps<MetricsQuery>) => {
  const { onChange, onFormChange, datasource } = props;
  const query = defaults(props.query, defaultMetricsCompositeQuery);
  const [propertiesOptions, setPropertiesOptions] = useState([]);
  const [availableOptions, setAvailableOptions] = useState([]);
  const [isPristine, setIsPristine] = useState(true);
  useEffect(() => {
    setIsPristine(false);
  }, []);

  useEffect(() => {
    /** Request available propertyNames by selected metrics */
    /* Reset previous selections: */
    !isPristine && onChange({ ...query, dimensions: defaultMetricsCompositeQuery.dimensions });
    datasource.getPropertiesDict(query.metricName).then(({ properties }) => {
      setPropertiesOptions(properties);
    });
  }, [query.metricName]);

  useEffect(() => {
    /** Reduce already selected propertyNames from available properties */
    if (propertiesOptions) {
      let choseOptions = query.dimensions.map(d => d.key); // options were already chose and are not available anymore
      const availableOptions = difference(propertiesOptions, choseOptions).map(value => ({ label: value, value }));
      setAvailableOptions(availableOptions);
    }
  }, [propertiesOptions, query.dimensions]);

  const getValues = useCallback(name => datasource.getMetricsPropVal(query.metricName, name), [query.metricName]);

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <MetricSearchField
            isClearable
            getMetricsOptions={datasource.getMetricsOptions.bind(datasource)}
            value={addLabel(query.metricName)}
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
      <div style={{ marginBottom: 4 }}>
        <KeyValueControl
          key={query.metricName}
          dimensionsQuery={query.dimensions}
          onChangeQuery={value => onFormChange('dimensions', value, true)}
          availableDimensionsNames={availableOptions}
          getValues={getValues}
        />
      </div>
    </>
  );
};

export default MetricsCompositeQueryEditor;
