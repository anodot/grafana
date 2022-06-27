import React from 'react';

// TODO: see https://grafana.com/docs/grafana/latest/developers/plugins/add-support-for-variables/
interface VariableQueryProps {
  query: any;
  onChange: (query: any, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  // const [state, setState] = useState(query);

  // const saveQuery = () => {
  //   onChange(state, `${state.query} (${state.namespace})`);
  // };
  //
  // const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
  //   setState({
  //     ...state,
  //     [event.currentTarget.name]: event.currentTarget.value,
  //   });

  return (
    <>
      <h4>TODO</h4>
    </>
  );
};
