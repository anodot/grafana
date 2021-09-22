import React, { useCallback, useEffect, useState } from 'react';
import { arrayToOptions } from '../utils/helpers';
import FormSelect, { NotOptionsType } from './FormField/FormSelect';
import { SelectableValue } from '@grafana/data';

interface SearchProps {
  value: string | SelectableValue[];
  onChange: (v: any) => void;
  getMetricsOptions: (str: string) => Promise<Array<{ value: string }>>;
  isMulti?: boolean;
  isClearable?: boolean;
  notOptions?: NotOptionsType;
  placeholder?: string;
}
const MetricSearchField: React.FC<SearchProps> = ({
  value,
  onChange,
  getMetricsOptions,
  isClearable,
  isMulti,
  notOptions,
  placeholder = '',
}) => {
  const [metricsList, setMetricsList] = useState([] as SelectableValue[]);
  const options = metricsList; //.concat(typeof value === 'string' ? [value] : value);

  useEffect(() => {
    /** Request Metrics Options onMount*/
    getMetricsOptions('').then(metrics => {
      setMetricsList(arrayToOptions(metrics, 'value'));
    });
  }, []);

  const onSearch = useCallback((searchString: string, { action }) => {
    action === 'input-change' &&
      getMetricsOptions(searchString).then(metrics => {
        setMetricsList(arrayToOptions(metrics, 'value'));
      });
  }, []);

  return (
    <FormSelect
      inputWidth={0}
      label={`Measure${isMulti ? 's' : ''}`}
      tooltip={'Select measures.'}
      value={value}
      options={options}
      onChange={onChange}
      onInputChange={onSearch}
      isClearable={isClearable}
      isMulti={isMulti}
      notOptions={notOptions}
      placeholder={placeholder}
      noOptionsMessage={'No measures to select'}
    />
  );
};

export default MetricSearchField;
