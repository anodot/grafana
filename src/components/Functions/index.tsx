import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@grafana/ui';

import { FlatObject } from '../../types';
import { FunctionsRow } from './FunctionsRow';
import { FunctionsNamesEnum } from '../../MetricsComposite/searchFunctionsMeta';
import RatioPairFunc from './RatioPairFunc';

export type FunctionsProps = {
  functionsConfigs: Array<FlatObject<any>>;
  selectedFunctions: Record<FunctionsNamesEnum, any>;
  onChangeFunctions(f: FlatObject<any>): void;
  groupByPropertiesList: string[];
  getMetricsOptions(str: string): Promise<any>;
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
      new: { functionLabel: '', functionName: null, parameters: {}, index: nestCounter + 1 },
    });
    setCounter(nestCounter + 1);
  }, [selectedFunctions, nestCounter]);

  return (
    <>
      {Object.keys(selectedFunctions).map((funcName, i) =>
        funcName === FunctionsNamesEnum.RATIO_PAIRS ? (
          <RatioPairFunc
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
            paramsValue={selectedFunctions[funcName]?.parameters}
            index={i}
            groupByPropertiesList={groupByPropertiesList}
            getMetricsOptions={getMetricsOptions}
          />
        ) : (
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
        )
      )}
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
