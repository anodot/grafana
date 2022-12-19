import React, { useCallback, useEffect, useState } from 'react';
import FormSelect from '../components/FormField/FormSelect';
import { alertAcknowledgeOptions, alertTypesOptions, feedbackOptions, severityOptions } from '../utils/constants';
import { AlertsQuery, ScenarioProps } from '../types';
import FormSwitch from '../components/FormField/FormSwitch';
import defaults from 'lodash/defaults';
import { SelectableValue } from '@grafana/data';

export const defaultAlertsQuery: Partial<AlertsQuery> = {
  showOpen: false,
  acknowledge: '',
  feedback: [],
};

enum FeedbacksEnums {
  noFeedback = 'noFeedback',
  positiveFeedback = 'positiveFeedback',
  negativeFeedback = 'negativeFeedback',
}

const AlertsQueryEditor = (props: ScenarioProps<AlertsQuery>) => {
  const { onRunQuery, datasource, onFormChange } = props;
  const [subscribersOptions, setSubscribers] = useState<SelectableValue[]>([]);
  const query = defaults(props.query, defaultAlertsQuery);

  useEffect(() => {
    /* Get options for Users and Channels selectors */
    onRunQuery();
    Promise.all([datasource.getUsers(), datasource.getChannels()]).then((results) => {
      const subscribersDict = {};
      const usersOptions = results[0]?.map((u) => ({
        label: `${u.firstName} ${u.lastName}`,
        value: u._id,
        type: 'user',
      }));
      const channelsOptions = results[1]?.map((ch) => ({ label: ch.name, value: ch.id, type: 'channel' }));
      const united = usersOptions.concat(channelsOptions);
      united.forEach((opt) => {
        subscribersDict[opt.value] = opt;
      });
      setSubscribers(usersOptions.concat(channelsOptions));
    });
  }, []);

  const onFeedbackChange = useCallback((currentMultiValues, selected) => {
    const selectedValue = selected?.option?.value;
    if (selectedValue) {
      if (selectedValue === FeedbacksEnums.noFeedback) {
        currentMultiValues = [selected?.option];
      }
      if ([FeedbacksEnums.positiveFeedback, FeedbacksEnums.negativeFeedback].includes(selectedValue)) {
        currentMultiValues = currentMultiValues.filter((v) => v.value !== FeedbacksEnums.noFeedback);
      }
    }
    return onFormChange('feedback', currentMultiValues, true);
  }, []);

  return (
    <>
      <div className="gf-form gf-form--grow">
        <FormSelect
          isMulti
          inputWidth={0}
          label={'Recipient (Users / Channels)'}
          value={query.recipient}
          options={subscribersOptions}
          onChange={(value) => onFormChange('recipient', value, true)}
        />
      </div>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isClearable
            inputWidth={0}
            label={'Acknowledge'}
            value={query.acknowledge}
            options={alertAcknowledgeOptions}
            onChange={(value) => onFormChange('acknowledge', value, true)}
          />
        </div>
        <div className="gf-form">
          <FormSwitch
            labelWidth={6}
            label={'Open only'}
            tooltip={'Show open alerts only'}
            value={query.showOpen}
            onChange={(e) => onFormChange('showOpen', e.currentTarget.checked, true)}
          />
        </div>
      </div>
      <div className="gf-form gf-form--grow">
        <FormSelect
          isMulti
          inputWidth={0}
          label={'Feedback'}
          value={query.feedback}
          options={feedbackOptions}
          onChange={onFeedbackChange}
        />
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
            onChange={(value) =>
              onFormChange(
                'types',
                value.map((d) => d.value),
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
            onChange={(value) =>
              onFormChange(
                'severities',
                value.map((d) => d.value),
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
