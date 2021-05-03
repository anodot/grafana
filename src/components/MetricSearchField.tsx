//@ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { arrayToOptions } from '../utils/helpers';
import FormSelect from './FormField/FormSelect';
import { SelectableValue } from '@grafana/data';

interface SearchProps {
  value: string | SelectableValue[];
  onChange: (v: any) => void;
  getMetricsOptions: (str: string) => Promise<Array<{ value: string }>>;
  isMulti?: boolean;
  isClearable?: boolean;
}

const MetricSearchField = ({ value, onChange, getMetricsOptions, isClearable, isMulti }: SearchProps) => {
  const [metricsList, setMetricsList] = useState([]);
  const options = metricsList.concat(typeof value === 'string' ? [value] : value);

  useEffect(() => {
    /** Request Metrics Options onMount*/
    getMetricsOptions('').then(metrics => {
      setMetricsList(arrayToOptions(metrics, 'value'));
    });
  }, []);

  const onSearch = useCallback((searchString, { action }) => {
    action === 'input-change' &&
      getMetricsOptions(searchString).then(metrics => {
        setMetricsList(arrayToOptions(metrics, 'value'));
      });
  }, []);

  return (
    <FormSelect
      inputWidth={0}
      label={'Measures'}
      tooltip={'Select measures.'}
      value={value}
      options={options}
      onChange={onChange}
      onInputChange={onSearch}
      isClearable={isClearable}
      isMulti={isMulti}
    />
  );
};

export default MetricSearchField;
