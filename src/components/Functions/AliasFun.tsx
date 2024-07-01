import React from 'react';
import FormSelect from '../FormField/FormSelect';
import { IconButton, Input } from '@grafana/ui';
import { FlatObject } from '../../types';
import { css, cx } from 'emotion';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;
export type AliasParams = {
  aliasName: string;
};
type Props = {
  selectedFunction: FlatObject<any>;
  paramsValue: AliasParams;
  onDelete(): void;
  onParamsChange(params: AliasParams): void;
};

const AliasFunc: React.FC<Props> = ({
  selectedFunction = {},
  onDelete,
  onParamsChange,
  paramsValue = {} as AliasParams,
}) => {
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
          menuPlacement={'top'}
        />
      </div>
      <div className="gf-form">
        <Input
          type={'text'}
          value={paramsValue.aliasName}
          onChange={({ target }) => onParamsChange({ ...paramsValue, aliasName: target['value'] })}
          width={7}
          invalid={!paramsValue.aliasName}
        />
      </div>
      <div className={iconWrapperClass}>
        <IconButton aria-label="trash" onClick={onDelete} name={'trash-alt'} size={'xl'} />
      </div>
    </div>
  );
};

export default AliasFunc;
