// @ts-nocheck
import React from 'react';
import { InlineFormLabel, Slider, PopoverContent } from '@grafana/ui';
import FormWrapper from './FormWrapper';
import { SelectableValue } from '@grafana/data';
import { SliderProps } from '@grafana/ui/components/Slider/types';

interface State {}

interface Props extends Partial<SliderProps> {
  label: string;
  value: SelectableValue;
  options?: any;
  queryKeyword?: boolean;
  disabled?: boolean;
  defaultValue?: SelectableValue;
  noOptionsMessage?: string;
  searchable?: boolean | true;
  labelWidth?: number | 14;
  inputWidth?: number | 30;
  placeholder?: string | '-';
  tooltip?: PopoverContent;
  className?: string;
  /* Triggers after slider's move stops */
  onAfterChange(event?: any): any;
  /* Exhaustively riggers on every slider's move */
  // onChange(event?: any): any;
}

/**
 * Default select field including label. Select element is grafana/ui <Select />.
 */
export default class FormSlider extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

  render() {
    const {
      label,
      tooltip,
      disabled,
      queryKeyword,
      labelWidth = 14,
      inputWidth = 30,
      className = '',
      min = 0,
      max = 100,
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
        <Slider min={min} max={max} {...remainingProps} />
      </FormWrapper>
    );
  }
}
