import { describe, it, expect } from 'vitest';
import {
  getPriorityFieldKey,
  PRIORITY_SCHEMA_FIELD_TYPE,
  PRIORITY_SCHEMA_FIELD_VALUE,
} from './priority-field';

describe('getPriorityFieldKey', () => {
  it('returns undefined for undefined or null schema', () => {
    expect(getPriorityFieldKey(undefined)).toBeUndefined();
    expect(getPriorityFieldKey(null)).toBeUndefined();
  });

  it('returns undefined when properties are missing or not an object', () => {
    expect(getPriorityFieldKey({} as any)).toBeUndefined();
    expect(getPriorityFieldKey({ properties: null } as any)).toBeUndefined();
  });

  it('detects an explicitly marked priority field', () => {
    const schema = {
      properties: {
        some_priority: {
          type: 'string',
          enum: ['critical', 'low', 'high', 'medium'],
          [PRIORITY_SCHEMA_FIELD_TYPE]: PRIORITY_SCHEMA_FIELD_VALUE,
        },
      },
    } as Record<string, unknown>;

    const key = getPriorityFieldKey(schema);
    expect(key).toBe('some_priority');
  });

  it('ignores an ordinary select with the same priority values', () => {
    const schema = {
      properties: {
        severity: {
          type: 'string',
          enum: ['critical', 'low', 'high', 'medium'],
        },
      },
    } as Record<string, unknown>;
    expect(getPriorityFieldKey(schema)).toBeUndefined();
  });

  it('ignores enums with different lengths or extra values', () => {
    const schemaExtra = {
      properties: {
        p: { enum: ['low', 'medium', 'high', 'critical', 'extra'] },
      },
    } as any;
    expect(getPriorityFieldKey(schemaExtra)).toBeUndefined();

    const schemaShort = {
      properties: {
        p: { enum: ['low', 'medium', 'high'] },
      },
    } as any;
    expect(getPriorityFieldKey(schemaShort)).toBeUndefined();
  });
});
