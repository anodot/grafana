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
export type PairsParams = {
  operation: Option;
  firstMeasure?: Option;
  firstAggregation: Option;
  firstGroupBy: string;

  secondMeasure: Option;
  secondAggregation: Option;
  secondGroupBy: string;
};
type Props = {
  selectedFunction: FlatObject<any>;
  paramsValue: PairsParams;
  functionConfig?: FlatObject<any>;
  onDelete(): void;
  onParamsChange(params: PairsParams): void;
  groupByPropertiesList: string[];
  getMetricsOptions(str: string): Promise<any>;
  selectedMeasure?: string;
};

const PairsFunc: React.FC<Props> = ({
  selectedFunction = {},
  onDelete,
  onParamsChange,
  paramsValue = {} as PairsParams,
  groupByPropertiesList,
  getMetricsOptions,
  selectedMeasure,
  functionConfig,
}) => {
  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
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
        <InlineFormLabel>Operation:</InlineFormLabel>
        <div className="gf-form gf-form--grow">
          <Select
            menuPlacement={'bottom'}
            value={paramsValue.operation}
            options={arrayToOptions(functionConfig?.operationOptions)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, operation: value });
            }}
          />
        </div>
        <div className={iconWrapperClass}>
          <IconButton aria-label="trash" onClick={onDelete} name={'trash-alt'} size={'xl'} />
        </div>
      </div>
      <div className="gf-form-inline">
        <div style={{ width: 20 }} />
        <div className="gf-form">
          <MetricSearchField
            placeholder={'Any Measure'}
            isClearable
            getMetricsOptions={getMetricsOptions}
            value={addLabel(selectedMeasure)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, firstMeasure: value });
            }}
            label="Divident measure"
            disabled
          />
        </div>
        <InlineFormLabel>Group By:</InlineFormLabel>
        <div className="gf-form">
          <Select
            menuPlacement={'bottom'}
            value={paramsValue.firstAggregation}
            options={arrayToOptions(aggregationKeys)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, firstAggregation: value });
            }}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <Select
            isMulti
            menuPlacement={'bottom'}
            value={paramsValue.firstGroupBy && JSON.parse(paramsValue.firstGroupBy)?.properties}
            options={arrayToOptions(groupByPropertiesList)}
            onChange={(selectedOptions) => {
              const selected = selectedOptions.map((o) => o.value);
              onParamsChange({
                ...paramsValue,
                firstGroupBy: JSON.stringify({ properties: selected }),
              });
            }}
          />
        </div>
      </div>
      <div className="gf-form-inline">
        <div style={{ width: 20 }} />
        <div className="gf-form">
          <MetricSearchField
            placeholder={'Any Measure'}
            isClearable
            getMetricsOptions={getMetricsOptions}
            value={paramsValue.secondMeasure}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, secondMeasure: value });
            }}
            label="Divisor measure"
          />
        </div>
        <InlineFormLabel>Group By:</InlineFormLabel>
        <div className="gf-form">
          <Select
            menuPlacement={'bottom'}
            value={paramsValue.secondAggregation}
            options={arrayToOptions(aggregationKeys)}
            onChange={(value) => {
              onParamsChange({ ...paramsValue, secondAggregation: value });
            }}
          />
        </div>
        <div className="gf-form gf-form--grow">
          <Select
            isMulti
            menuPlacement={'bottom'}
            value={paramsValue.secondGroupBy && JSON.parse(paramsValue.secondGroupBy)?.properties}
            options={arrayToOptions(groupByPropertiesList)}
            onChange={(selectedOptions) => {
              const selected = selectedOptions.map((o) => o.value);
              onParamsChange({
                ...paramsValue,
                secondGroupBy: JSON.stringify({ properties: selected }),
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

export default PairsFunc;
