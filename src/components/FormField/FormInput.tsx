// @ts-nocheck
import React from 'react';

import { Field, InlineFormLabel, Input, PopoverContent } from '@grafana/ui';
import FormWrapper from './FormWrapper';

interface State {}

interface Props {
  label: string;
  value: string | number;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  queryKeyword?: boolean;
  labelWidth?: number | 14;
  inputWidth?: number | 30;
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
export default class FormInput extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

  render() {
    const {
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
      ...remainingProps
    } = this.props;

    return (
      <FormWrapper disabled={disabled} stretch={!inputWidth}>
        <InlineFormLabel
          className={queryKeyword ? `query-keyword ${className}` : className}
          width={labelWidth}
          tooltip={tooltip}
        >
          {label}
        </InlineFormLabel>
        <Input css={''} width={inputWidth} disabled={disabled} {...remainingProps} />
      </FormWrapper>
    );
  }
}
