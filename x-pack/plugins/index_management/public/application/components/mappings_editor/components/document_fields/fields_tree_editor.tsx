/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useCallback } from 'react';
import { EuiButtonEmpty, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import { useMappingsState, useDispatch } from '../../mappings_state_context';
import { FieldsList, CreateField } from './fields';

interface Props {
  onCancelAddingNewFields?: () => void;
  isAddingFields?: boolean;
}

export const DocumentFieldsTreeEditor = ({ onCancelAddingNewFields, isAddingFields }: Props) => {
  const dispatch = useDispatch();
  const {
    fields: { byId, rootLevelFields },
    documentFields: { status, fieldToAddFieldTo },
  } = useMappingsState();

  const getField = useCallback((fieldId: string) => byId[fieldId], [byId]);
  const fields = useMemo(() => rootLevelFields.map(getField), [rootLevelFields, getField]);

  const addField = useCallback(() => {
    dispatch({ type: 'documentField.createField' });
  }, [dispatch]);

  const renderCreateField = () => {
    // The "fieldToAddFieldTo" is undefined when adding to the top level "properties" object.
    const isCreateFieldFormVisible = status === 'creatingField' && fieldToAddFieldTo === undefined;

    if (!isCreateFieldFormVisible) {
      return null;
    }

    return (
      <CreateField
        isCancelable={fields.length > 0}
        allFields={byId}
        isRootLevelField
        onCancelAddingNewFields={onCancelAddingNewFields}
        isAddingFields={isAddingFields}
      />
    );
  };

  const renderAddFieldButton = () => {
    const isDisabled = status !== 'idle';
    return (
      <>
        <EuiSpacer />
        <EuiButtonEmpty
          disabled={isDisabled}
          onClick={addField}
          iconType="plusInCircleFilled"
          data-test-subj="addFieldButton"
        >
          {i18n.translate('xpack.idxMgmt.mappingsEditor.addFieldButtonLabel', {
            defaultMessage: 'Add field',
          })}
        </EuiButtonEmpty>
      </>
    );
  };

  return (
    <>
      <FieldsList fields={fields} state={useMappingsState()} isAddingFields={isAddingFields} />
      {renderCreateField()}
      {renderAddFieldButton()}
    </>
  );
};
