import React, { useEffect, useState } from 'react';
import FormSelect from '../components/FormField/FormSelect';
import { alertTypesOptions, severityOptions } from '../utils/constants';
import { AlertsQuery, ScenarioProps } from '../types';
import FormSwitch from '../components/FormField/FormSwitch';
import defaults from 'lodash/defaults';

export const defaultAlertsQuery: Partial<AlertsQuery> = {
  showOpen: false,
};

const AlertsQueryEditor = (props: ScenarioProps<AlertsQuery>) => {
  const { onRunQuery, datasource, onFormChange } = props;
  const [subscribersOptions, setSubscribers] = useState([]);
  const query = defaults(props.query, defaultAlertsQuery);

  useEffect(() => {
    /* Get options for Users and Channels selectors */
    onRunQuery();
    Promise.all([datasource.getUsers(), datasource.getChannels()]).then(results => {
      const subscribersDict = {};
      const usersOptions = results[0].map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u._id, type: 'user' }));
      const channelsOptions = results[1].map(ch => ({ label: ch.name, value: ch.id, type: 'channel' }));
      const united = usersOptions.concat(channelsOptions);
      united.forEach(opt => {
        subscribersDict[opt.value] = opt;
      });
      setSubscribers(usersOptions.concat(channelsOptions));
    });
  }, []);

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            inputWidth={0}
            label={'Recipient (Users / Channels)'}
            value={query.recipient}
            options={subscribersOptions}
            onChange={value => onFormChange('recipient', value, true)}
          />
        </div>
        <div className="gf-form">
          <FormSwitch
            labelWidth={6}
            label={'Open only'}
            tooltip={'Show open alerts only'}
            value={query.showOpen}
            onChange={e => onFormChange('showOpen', e.currentTarget.checked, true)}
          />
        </div>
      </div>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            isClearable
            inputWidth={0}
            label={'Alert Type'}
            value={query.types}
            options={alertTypesOptions}
            onChange={value =>
              onFormChange(
                'types',
                value.map(d => d.value),
                true
              )
            }
          />
        </div>
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            isClearable
            inputWidth={0}
            label={'Severity'}
            value={query.severities}
            options={severityOptions}
            onChange={value =>
              onFormChange(
                'severities',
                value.map(d => d.value),
                true
              )
            }
          />
        </div>
      </div>
    </>
  );
};

export default AlertsQueryEditor;
