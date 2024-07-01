import React from 'react';
import FormSelect from '../FormField/FormSelect';
import { IconButton, Input, Select } from '@grafana/ui';
import { arrayToOptions } from '../../utils/helpers';
import MetricSearchField from '../MetricSearchField';
import { FlatObject } from '../../types';
import { css, cx } from 'emotion';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;

type RowProps = {
  selectedFunction: FlatObject<any>;
  functionConfig?: FlatObject<any>;
  paramsValue: FlatObject<any>;
  index: number;
  onDelete(): void;
  onParamsChange(params: FlatObject<any>): void;
  groupByPropertiesList: string[];
  getMetricsOptions(str: string): Promise<any>;
};

export const FunctionsRow: React.FC<RowProps> = ({
  selectedFunction = {},
  functionConfig = {},
  onDelete,
  onParamsChange,
  paramsValue = {},
  index,
  groupByPropertiesList,
  getMetricsOptions,
}) => {
  const { parameters } = functionConfig;

  return (
    <div className="gf-form-inline">
      <div className="gf-form gf-form--grow">
        <div style={{ width: 10 * index }} />
        <FormSelect
          disabled={selectedFunction.disabled}
          label={selectedFunction.label}
          tooltip={selectedFunction.tooltip}
          inputWidth={0}
          value={selectedFunction.value}
          options={selectedFunction.options}
          onChange={selectedFunction.onChange}
          menuPlacement={'top'}
        />
      </div>
      {parameters?.map((param) => (
        <div key={param.name} className="gf-form gf-form--grow">
          {param.name === 'Scale Factor' && (
            <Input
              type="number"
              onChange={(e: any) => onParamsChange({ ...paramsValue, [param.name]: e.target.value })}
              value={paramsValue?.[param.name]}
              required
            />
          )}
          {param.name === 'Group By' && (
            <Select
              isMulti
              menuPlacement={'bottom'}
              value={paramsValue[param.name] && JSON.parse(paramsValue[param.name])?.properties}
              options={arrayToOptions(groupByPropertiesList)}
              onChange={(selectedOptions) => {
                const selected = selectedOptions.map((o) => o.value);
                onParamsChange({ ...paramsValue, [param.name]: JSON.stringify({ properties: selected }) });
              }}
            />
          )}
          {param.name === 'Aggregation' && (
            <Select
              menuPlacement={'bottom'}
              value={paramsValue[param.name]}
              options={arrayToOptions(param.optionalValues)}
              onChange={(value) => {
                onParamsChange({ ...paramsValue, [param.name]: value });
              }}
            />
          )}
          {param.name === 'metrics' && (
            <MetricSearchField
              placeholder={'Any Measure'}
              isClearable
              getMetricsOptions={getMetricsOptions}
              value={paramsValue[param.name]}
              onChange={(value) => {
                onParamsChange({ ...paramsValue, [param.name]: value });
              }}
              label="Divisor measure"
            />
          )}
        </div>
      ))}
      <div className={iconWrapperClass}>
        <IconButton aria-label="trash" onClick={onDelete} name={'trash-alt'} size={'xl'} />
      </div>
    </div>
  );
};
