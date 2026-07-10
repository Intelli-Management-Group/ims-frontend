import { describe, expect, it } from 'vitest';
import type { FormElementOrList } from '@/types/form-types';
import { getDefaultFormElement } from './generate-default-value';

describe('getDefaultFormElement', () => {
  it('returns defaults for text Input, Checkbox, and Select', () => {
    const elements: FormElementOrList[] = [
      {
        id: '1',
        name: 'title',
        fieldType: 'Input',
        type: 'text',
        label: 'Title',
      },
      {
        id: '2',
        name: 'accepted',
        fieldType: 'Checkbox',
        label: 'Accept',
      },
      {
        id: '3',
        name: 'country',
        fieldType: 'Select',
        label: 'Country',
        placeholder: '',
        description: '',
        options: [
          { value: 'us', label: 'US' },
          { value: 'uk', label: 'UK' },
        ],
      },
    ];

    const defaults = getDefaultFormElement(elements);
    expect(defaults).toEqual({
      title: '',
      accepted: false,
      country: 'us',
    });
  });

  it('returns defaults for picker field types', () => {
    const elements: FormElementOrList[] = [
      {
        id: '4',
        name: 'date-range',
        fieldType: 'DateRangePicker',
        label: 'Date Range',
      },
      {
        id: '5',
        name: 'meeting-time',
        fieldType: 'TimePicker',
        label: 'Meeting Time',
      },
    ];

    const defaults = getDefaultFormElement(elements);
    expect(defaults).toEqual({
      date_range: { start: '', end: '' },
      meeting_time: '',
    });
  });
});
