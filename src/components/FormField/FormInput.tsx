import React, { RefAttributes } from 'react';

import { InlineFormLabel, Input, PopoverContent } from '@grafana/ui';
import FormWrapper from './FormWrapper';

interface Props extends RefAttributes<HTMLInputElement> {
  label: string;
  value: string | number;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  queryKeyword?: boolean;
  labelWidth?: number;
  inputWidth?: number;
  tooltip?: PopoverContent;
  className?: string;
  type?: string;
  required?: boolean;
  error?: string;
  name?: string;
  onChange(event?: any): any;
}

/**
 * Default input field including label. Input element is grafana/ui <Input />.
 */
const FormInput: React.FC<Props> = ({
  label,
  tooltip,
  queryKeyword,
  disabled,
  labelWidth = 14,
  inputWidth = 30,
  className = '',
  required,
  invalid,
  error,
  ...inputProps
}) => {
  // @ts-ignore
  return (
    <FormWrapper disabled={disabled} stretch={!inputWidth}>
      <InlineFormLabel
        className={queryKeyword ? `query-keyword ${className}` : className}
        width={labelWidth}
        tooltip={tooltip}
      >
        {label}
      </InlineFormLabel>
      <Input {...inputProps} width={inputWidth} disabled={disabled} invalid={invalid} />
    </FormWrapper>
  );
};

export default FormInput;
