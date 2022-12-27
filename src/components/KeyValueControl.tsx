import React, { useState, useEffect, useCallback } from 'react';
import FormSelect from './FormField/FormSelect';
import { Button, IconButton } from '@grafana/ui';
import { css, cx } from 'emotion';
import { addLabel } from '../utils/helpers';
import { SelectableValue } from '@grafana/data';
import { DimensionType } from '../types';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;

interface KVRowPropsType {
  dimensionName: any;
  dimensionValue: any;
  onDelete(a: any): void;
  withNotControl?: boolean;
  onNotChange(a: any): void;
  notValue: boolean;
  isMultiValue?: boolean;
}

const KVRow: React.FC<KVRowPropsType> = ({
  dimensionName = {},
  dimensionValue = {},
  onDelete,
  // withNotControl,
  // onNotChange,
  // notValue,
  isMultiValue,
}) => (
  <div className="gf-form-inline">
    <div className="gf-form gf-form--grow">
      <FormSelect
        disabled={dimensionName.disabled}
        label={dimensionName.label}
        tooltip={dimensionName.tooltip}
        inputWidth={0}
        value={addLabel(dimensionName.value)}
        options={dimensionName.options}
        onChange={dimensionName.onChange}
      />
    </div>
    <div className="gf-form gf-form--grow">
      <FormSelect
        disabled={dimensionValue.disabled}
        label={dimensionValue.label}
        tooltip={dimensionValue.tooltip}
        labelWidth={1}
        inputWidth={30}
        value={dimensionValue?.value?.map?.((d) => d.value)}
        options={dimensionValue.options}
        onChange={dimensionValue.onChange}
        isLoading={dimensionValue.isLoading}
        isMulti={isMultiValue}
        // notOptions={{
        //   notCheckboxDisabled: false,
        //   showNotCheckbox: withNotControl,
        //   notCheckboxValue: notValue,
        //   onNotChange,
        // }}
      />
    </div>
    <div className={iconWrapperClass}>
      <IconButton onClick={onDelete} name={'trash-alt'} size={'xl'} />
    </div>
  </div>
);

interface KeyValuePropsType {
  dimensionsQuery: DimensionType[];
  onChangeDimensions(a: any): void;
  availableDimensionsNames: SelectableValue[];
  getValues(name: any): Promise<any>;
  withNotControl?: boolean;
}

const KeyValueControl: React.FC<KeyValuePropsType> = ({
  dimensionsQuery = [],
  onChangeDimensions,
  availableDimensionsNames,
  getValues,
  withNotControl,
}) => {
  const [valuesMap, setValuesMap] = useState({});

  useEffect(() => {
    /** Requests values options for every new unknown key */
    const keys = dimensionsQuery.map((d) => d.key);
    keys.forEach((k) => {
      if (!valuesMap[k]) {
        setValuesMap({
          ...valuesMap,
          [k]: 'isLoading',
        });
        const promise = getValues(k);
        promise.then(({ propertyValues }) => {
          setValuesMap({
            ...valuesMap,
            [k]: propertyValues.map(({ value }) => ({ label: value, value })),
          });
        });
      }
    });
  }, [dimensionsQuery, valuesMap]);

  const onChange = useCallback(
    (propName, propValue, i) => {
      // @ts-ignore
      const newQuery = [...dimensionsQuery];
      const newDimension = {
        key: newQuery[i]?.key,
        /** if key is changing - reset the value to '', else set value */
        value: propName === 'key' ? '' : newQuery[i]?.value,
        not: propName === 'key' ? false : newQuery[i]?.not,
      };

      newDimension[propName] = propValue;
      newQuery[i] = newDimension;

      onChangeDimensions(newQuery);
    },
    [dimensionsQuery]
  );

  const onDelete = useCallback(
    (i) => {
      const newQuery = [...dimensionsQuery];
      newQuery.splice(i, 1);
      onChangeDimensions(newQuery);
    },
    [dimensionsQuery]
  );

  const onAdd = useCallback(() => {
    onChangeDimensions([...dimensionsQuery, { key: null, value: [], not: false }]);
  }, [dimensionsQuery]);

  const isLastEmpty = dimensionsQuery.length && !dimensionsQuery[dimensionsQuery.length - 1]?.value?.length;

  return (
    <>
      {dimensionsQuery.map((dimension, i) => (
        <KVRow
          key={dimension.key}
          withNotControl={withNotControl}
          dimensionName={{
            label: `Dimension ${i + 1}`,
            options: availableDimensionsNames,
            value: dimension.key,
            onChange: (d) => onChange('key', d.value, i),
          }}
          dimensionValue={{
            label: `:`,
            options: dimension.key ? valuesMap[dimension.key] : [],
            value: dimension,
            onChange: (d) => onChange('value', d, i),
            isLoading: valuesMap[dimension.key] === 'isLoading',
          }}
          onDelete={() => onDelete(i)}
          onNotChange={(e) => onChange('not', e.target.checked, i)}
          notValue={Boolean(dimension.not)}
          isMultiValue
        />
      ))}
      <Button disabled={Boolean(availableDimensionsNames.length === 0 || isLastEmpty)} onClick={onAdd}>
        + Dimension
      </Button>
    </>
  );
};

export default KeyValueControl;
