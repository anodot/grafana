// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import FormSelect from './FormField/FormSelect';
import { IconButton } from '@grafana/ui';
import { css, cx } from 'emotion';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;

const KVRow = ({ dimensionName = {}, dimensionValue = {}, index, length, onAdd, onDelete }) => (
  <div className="gf-form-inline">
    <div className="gf-form gf-form--grow">
      <FormSelect
        disabled={dimensionName.disabled}
        label={dimensionName.label}
        tooltip={dimensionName.tooltip}
        inputWidth={0}
        value={dimensionName.value}
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
        inputWidth={0}
        value={dimensionValue.value}
        options={dimensionValue.options}
        onChange={dimensionValue.onChange}
        isLoading={dimensionValue.isLoading}
      />
    </div>
    {length > 1 && (
      <div className={iconWrapperClass}>
        <IconButton onClick={onDelete} name={'trash-alt'} size={'xl'} surface={'panel'} />
      </div>
    )}
    {index === length - 1 && (
      <div className={iconWrapperClass}>
        <IconButton
          disabled={!dimensionValue.value}
          onClick={onAdd}
          name={'plus-circle'}
          size={'xl'}
          surface={'panel'}
        />
      </div>
    )}
  </div>
);

const KeyValueControl = ({ dimensionsQuery = [], onChangeQuery, availableDimensionsNames, getValues }) => {
  const [valuesMap, setValuesMap] = useState({});
  useEffect(() => {
    /* Requests values options for every new unknown key */
    const keys = dimensionsQuery.map(d => d.key);
    keys.forEach(k => {
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
    (key, value, i) => {
      const newQuery = [...dimensionsQuery];
      const newDimension = {
        key: key?.label || newQuery[i]?.key,
        value: value?.label || newQuery[i]?.value,
      };
      newQuery[i] = newDimension;
      onChangeQuery(newQuery);
    },
    [dimensionsQuery]
  );

  const onDelete = useCallback(
    i => {
      const newQuery = [...dimensionsQuery];
      newQuery.splice(i, 1);
      onChangeQuery(newQuery);
    },
    [dimensionsQuery]
  );

  const onAdd = useCallback(() => {
    onChangeQuery([...dimensionsQuery, { key: null, value: null }]);
  }, [dimensionsQuery]);

  return (
    <>
      {dimensionsQuery.map((dimension, i) => (
        <KVRow
          key={dimension.key}
          dimensionName={{
            label: `Dimension ${i + 1}`,
            options: availableDimensionsNames,
            value: dimension.key,
            onChange: name => onChange(name, null, i),
          }}
          dimensionValue={{
            label: `:`,
            options: dimension.key ? valuesMap[dimension.key] : [],
            value: dimension.value,
            onChange: value => onChange(null, value, i),
            isLoading: valuesMap[dimension.key] === 'isLoading',
          }}
          index={i}
          length={dimensionsQuery.length}
          onAdd={onAdd}
          onDelete={() => onDelete(i)}
        />
      ))}
    </>
  );
};

export default KeyValueControl;
