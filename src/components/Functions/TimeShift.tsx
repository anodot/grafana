import React, { useEffect } from 'react';
import FormSelect from '../FormField/FormSelect';
import { IconButton, Input, Select } from '@grafana/ui';
import { FlatObject, Option } from '../../types';
import { css, cx } from 'emotion';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;
export type TimeShiftParams = {
  size: Option;
  number: number;
};
type Props = {
  selectedFunction: FlatObject<any>;
  paramsValue: TimeShiftParams;
  functionConfig?: FlatObject<any>;
  onDelete(): void;
  onParamsChange(params: TimeShiftParams): void;
};

const TimeShiftFunc: React.FC<Props> = ({
  selectedFunction = {},
  onDelete,
  onParamsChange,
  paramsValue = {} as TimeShiftParams,
  functionConfig,
}) => {
  useEffect(() => {
    onParamsChange({ ...paramsValue, size: functionConfig?.durationOptions[0], number: 1 });
  }, []);

  return (
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
      <div className="gf-form">
        <Input
          type={'number'}
          value={paramsValue.number}
          onChange={({ target }) => onParamsChange({ ...paramsValue, number: +target['value'] })}
          width={7}
        />
      </div>
      <div className="gf-form gf-form--grow">
        <Select
          menuPlacement={'bottom'}
          value={paramsValue.size}
          options={functionConfig?.durationOptions}
          onChange={(value) => {
            onParamsChange({ ...paramsValue, size: value });
          }}
        />
      </div>
      <div className={iconWrapperClass}>
        <IconButton aria-label="trash" onClick={onDelete} name={'trash-alt'} size={'xl'} />
      </div>
    </div>
  );
};

export default TimeShiftFunc;
