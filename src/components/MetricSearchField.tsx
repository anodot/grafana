import React, { useCallback, useEffect, useState } from 'react';
import { arrayToOptions } from '../utils/helpers';
import FormSelect, { FormSelectProps, NotOptionsType } from './FormField/FormSelect';
import { SelectableValue } from '@grafana/data';
import { MeasureWithComposites } from '../types';

interface SearchProps extends Partial<FormSelectProps> {
  value: string | SelectableValue;
  onChange: (v: any) => void;
  getMetricsOptions: (str: string) => Promise<MeasureWithComposites[] | { error: any }>;
  isMulti?: boolean;
  isClearable?: boolean;
  notOptions?: NotOptionsType;
  placeholder?: string;
  label?: string;
}

const MetricSearchField: React.FC<SearchProps> = ({
  value,
  onChange,
  getMetricsOptions,
  isClearable,
  isMulti,
  notOptions,
  label,
  placeholder = '',
  ...otherProps
}) => {
  const [metricsList, setMetricsList] = useState([] as SelectableValue[]);
  const options = metricsList; //.concat(typeof value === 'string' ? [value] : value);

  useEffect(() => {
    /** Request Metrics Options onMount*/
    getMetricsOptions('').then((metrics) => {
      if (!('error' in metrics)) {
        setMetricsList(arrayToOptions(metrics, 'value', true));
      }
    });
  }, []);

  const onSearch = useCallback(
    (searchString: string, { action }) => {
      action === 'input-change' &&
        getMetricsOptions(searchString).then((metrics) => {
          if (!('error' in metrics)) {
            setMetricsList(arrayToOptions(metrics, 'value', true));
          }
        });
    },
    [getMetricsOptions]
  );

  return (
    <FormSelect
      inputWidth={0}
      label={label || ` 5Measure${isMulti ? 's' : ''}`}
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
      {...otherProps}
    />
  );
};

export default MetricSearchField;
