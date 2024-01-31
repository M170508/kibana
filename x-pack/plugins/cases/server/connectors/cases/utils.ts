/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isPlainObject, partition, toString } from 'lodash';
import type { BulkGetOracleRecordsResponse, OracleRecord, OracleRecordError } from './types';

export const isRecordError = (so: OracleRecord | OracleRecordError): so is OracleRecordError =>
  (so as OracleRecordError).error != null;

export const partitionRecordsByError = (
  res: BulkGetOracleRecordsResponse
): [OracleRecord[], OracleRecordError[]] => {
  const [errors, validRecords] = partition(res, isRecordError) as [
    OracleRecordError[],
    OracleRecord[]
  ];

  return [validRecords, errors];
};

export const partitionByNonFoundErrors = <T extends Array<{ statusCode: number }>>(
  errors: T
): [T, T] => {
  const [nonFoundErrors, restOfErrors] = partition(errors, (error) => error.statusCode === 404) as [
    T,
    T
  ];

  return [nonFoundErrors, restOfErrors];
};

export const convertValueToString = (value: unknown): string => {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '';
    }
  }

  return toString(value);
};
