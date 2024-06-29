import React from 'react';
import FormSelect from '../FormField/FormSelect';
import { IconButton, InlineFormLabel, Select } from '@grafana/ui';
import { addLabel, arrayToOptions } from '../../utils/helpers';
import MetricSearchField from '../MetricSearchField';
import { FlatObject, Option } from '../../types';
import { css, cx } from 'emotion';
import { aggregationKeys } from './searchFunctionsMeta';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;
export type RatioParams = {
  dividentMeasure?: Option;
  dividentAggregation: Option;
  dividentGroupBy: string;

  divisorMeasure: Option;
  divisorAggregation: Option;
  divisorGroupBy: string;
};
type RatioPairFuncProps = {
  selectedFunction: FlatObject<any>;
  functionConfig?: FlatObject<any>;
  paramsValue: RatioParams;
  index: number;
  onDelete(): void;
  onParamsChange(params: RatioParams): void;
  groupByPropertiesList: string[];
  getMetricsOptions(str: string): Promise<any>;
  selectedMeasure?: string;
};

export const RatioPairFunc: React.FC<RatioPairFuncProps> = ({
  selectedFunction = {},
  onDelete,
  onParamsChange,
  paramsValue = {} as RatioParams,
  index,
  groupByPropertiesList,
  getMetricsOptions,
  selectedMeasure,
}) => {
  return (
    <>
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
          />
        </div>
        <div className={iconWrapperClass}>
          <IconButton aria-label="trash" onClick={onDelete} name={'trash-alt'} size={'xl'} />
        </div>
      </div>
      <div className="gf-form-inline" style={{ padding: '0, 20px' }}>
        <div className="gf-form">
          <MetricSearchField
            placeholder={'Any Measure'}
            isClearable
            getMetricsOptions={getMetricsOptions}
            value={addLabel(selectedMeasure)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, dividentMeasure: value });
            }}
            label="Divident measure"
            disabled
          />
        </div>
        <InlineFormLabel>Group By:</InlineFormLabel>
        <div className="gf-form">
          <Select
            menuPlacement={'bottom'}
            value={paramsValue.dividentAggregation}
            options={arrayToOptions(aggregationKeys)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, dividentAggregation: value });
            }}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <Select
            isMulti
            menuPlacement={'bottom'}
            value={paramsValue.dividentGroupBy && JSON.parse(paramsValue.dividentGroupBy)?.properties}
            options={arrayToOptions(groupByPropertiesList)}
            onChange={(selectedOptions) => {
              const selected = selectedOptions.map((o) => o.value);
              onParamsChange({
                ...paramsValue,
                dividentGroupBy: JSON.stringify({ properties: selected }),
              });
            }}
          />
        </div>
      </div>
      <div className="gf-form-inline">
        <div className="gf-form">
          <MetricSearchField
            placeholder={'Any Measure'}
            isClearable
            getMetricsOptions={getMetricsOptions}
            value={paramsValue.divisorMeasure}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, divisorMeasure: value });
            }}
            label="Divisor measure"
          />
        </div>
        <InlineFormLabel>Group By:</InlineFormLabel>
        <div className="gf-form">
          <Select
            menuPlacement={'bottom'}
            value={paramsValue.divisorAggregation}
            options={arrayToOptions(aggregationKeys)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, divisorAggregation: value });
            }}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <Select
            isMulti
            menuPlacement={'bottom'}
            value={paramsValue.divisorGroupBy && JSON.parse(paramsValue.divisorGroupBy)?.properties}
            options={arrayToOptions(groupByPropertiesList)}
            onChange={(selectedOptions) => {
              const selected = selectedOptions.map((o) => o.value);
              onParamsChange({
                ...paramsValue,
                divisorGroupBy: JSON.stringify({ properties: selected }),
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

export default RatioPairFunc;
