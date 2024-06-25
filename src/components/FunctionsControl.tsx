import React, { useCallback, useMemo, useState } from 'react';
import FormSelect from './FormField/FormSelect';
import { Button, IconButton, Input, Select } from '@grafana/ui';
import { css, cx } from 'emotion';
import { arrayToOptions } from '../utils/helpers';

import { FlatObject } from '../types';
import MetricSearchField from './MetricSearchField';

const iconWrapperClass = `gf-form ${cx(
  css`
    align-items: center;
    margin-left: 5px;
  `
)}`;

type FunctionsProps = {
  functionsConfigs: Array<FlatObject<any>>;
  selectedFunctions: FlatObject<any>;
  onChangeFunctions(f: FlatObject<any>): void;
  groupByPropertiesList: string[];
  getMetricsOptions(str: string): Promise<any>;
};

type RowProps = Omit<FunctionsProps, 'onChangeFunctions' | 'functionsConfigs' | 'selectedFunctions'> & {
  selectedFunction: FlatObject<any>;
  functionConfig?: FlatObject<any>;
  paramsValue: FlatObject<any>;
  index: number;
  onDelete(): void;
  onParamsChange(params: FlatObject<any>): void;
};
const FunctionsRow: React.FC<RowProps> = ({
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
                console.log('FunctionsControl:98', value);
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

const FunctionsControl: React.FC<FunctionsProps> = ({
  functionsConfigs,
  selectedFunctions = {},
  onChangeFunctions,
  groupByPropertiesList,
  getMetricsOptions,
}) => {
  const [nestCounter, setCounter] = useState(0);
  const availableFunctions = useMemo(() => {
    const selectedKeys = Object.keys(selectedFunctions);
    return functionsConfigs
      .filter((f) => !selectedKeys.includes(f.name) && f.name !== 'new')
      .map((s) => ({ label: s.displayName, value: s.name }));
  }, [selectedFunctions, functionsConfigs]);

  const onFunctionChange = useCallback(
    (id, fName, fParams) => {
      const newFunctions = { ...selectedFunctions };
      const func = {
        functionName: fName?.value || newFunctions[id]?.functionName,
        functionLabel: fName?.label || newFunctions[id]?.functionLabel,
        parameters: !!fParams ? fParams : newFunctions[id]?.parameters,
        index: newFunctions[id]?.index,
      };
      newFunctions[func.functionName] = func;
      if (id !== func.functionName) {
        delete newFunctions[id];
      }
      onChangeFunctions(newFunctions);
    },
    [selectedFunctions]
  );

  const onDelete = useCallback(
    (id) => {
      const newQuery = { ...selectedFunctions };
      delete newQuery[id];
      onChangeFunctions(newQuery);
    },
    [selectedFunctions]
  );

  const onAdd = useCallback(() => {
    onChangeFunctions({
      ...selectedFunctions,
      new: { functionLabel: '', functionName: null, parameters: {}, index: nestCounter },
    });
    setCounter(nestCounter + 1);
  }, [selectedFunctions, nestCounter]);

  return (
    <>
      {Object.keys(selectedFunctions).map((funcName, i) => (
        <FunctionsRow
          key={funcName}
          selectedFunction={{
            label: `Function ${i + 1}`,
            options: availableFunctions,
            value: {
              label: selectedFunctions[funcName]?.functionLabel,
              value: selectedFunctions[funcName]?.functionName,
            },
            onChange: (newName) => onFunctionChange(funcName, newName, null),
          }}
          functionConfig={functionsConfigs.find((f) => f.name === funcName)}
          onDelete={() => onDelete(funcName)}
          onParamsChange={(value) => onFunctionChange(funcName, null, value)}
          paramsValue={selectedFunctions[funcName].parameters}
          index={i}
          groupByPropertiesList={groupByPropertiesList}
          getMetricsOptions={getMetricsOptions}
        />
      ))}
      <Button
        style={{ width: 112 }}
        disabled={!availableFunctions.length || 'new' in selectedFunctions}
        onClick={onAdd}
      >
        + {Object.keys(selectedFunctions).length > 0 && 'Child '}Function
      </Button>
    </>
  );
};

export default FunctionsControl;
