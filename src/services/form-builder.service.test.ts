import { beforeEach, describe, expect, it } from 'vitest';
import { formBuilderCollection } from '@/db-collections/form-builder.collections';
import {
  DEFAULT_FORM_ELEMENTS,
  DEFAULT_FORM_SETTINGS,
  appendElement,
  getStoredFormName,
  initializeFormBuilder,
  resetFormElements,
  setFormName,
} from './form-builder.service';

const FORM_ID = 1 as const;

async function resetFormBuilderStore(): Promise<void> {
  localStorage.clear();
  try {
    if (formBuilderCollection.get(FORM_ID)) {
      await formBuilderCollection.delete(FORM_ID).isPersisted.promise;
    }
  } catch {
    localStorage.removeItem('form-builder');
  }
  initializeFormBuilder();
}

describe('form-builder.service', () => {
  beforeEach(async () => {
    await resetFormBuilderStore();
  });

  it('initializeFormBuilder seeds defaults', () => {
    const row = formBuilderCollection.get(FORM_ID);
    expect(row).toBeDefined();
    expect(row?.formName).toBe('');
    expect(row?.formElements).toEqual(DEFAULT_FORM_ELEMENTS);
    expect(row?.settings).toMatchObject(DEFAULT_FORM_SETTINGS);
  });

  it('setFormName updates persisted form name', () => {
    expect(setFormName('My Form')).toBe(true);
    expect(formBuilderCollection.get(FORM_ID)?.formName).toBe('My Form');
    expect(getStoredFormName()).toBe('My Form');
  });

  it('appendElement adds a field and preserves form name', () => {
    setFormName('Contact');
    appendElement({ fieldType: 'Input' });
    const row = formBuilderCollection.get(FORM_ID);
    expect(row?.formName).toBe('Contact');
    const elements = row?.formElements as unknown[];
    expect(Array.isArray(elements)).toBe(true);
    expect(elements?.length).toBe(1);
    expect((elements?.[0] as { fieldType?: string }).fieldType).toBe('Input');
  });

  it('supports adding picker field types', () => {
    appendElement({ fieldType: 'DateRangePicker' });
    appendElement({ fieldType: 'TimePicker' });
    const elements = formBuilderCollection.get(FORM_ID)?.formElements as Array<{
      fieldType?: string;
    }>;
    expect(elements?.[0]?.fieldType).toBe('DateRangePicker');
    expect(elements?.[1]?.fieldType).toBe('TimePicker');
  });

  it('resetFormElements clears elements', () => {
    appendElement({ fieldType: 'Checkbox' });
    expect(
      (formBuilderCollection.get(FORM_ID)?.formElements as unknown[])?.length,
    ).toBe(1);
    expect(resetFormElements()).toBe(true);
    expect(formBuilderCollection.get(FORM_ID)?.formElements).toEqual([]);
  });
});
