import { describe, expect, it } from 'vitest';
import type { FormElementOrList } from '@/types/form-types';
import {
  generateFormJsonSchema,
  generateFormUiSchema,
} from './generate-form-json-schema';

describe('generateFormJsonSchema / generateFormUiSchema', () => {
  const minimalForm: FormElementOrList[] = [
    {
      id: 'f-email',
      name: 'user.email',
      fieldType: 'Input',
      type: 'email',
      label: 'Email',
      required: true,
    },
    {
      id: 'f-agree',
      name: 'agree',
      fieldType: 'Checkbox',
      label: 'I agree',
      required: false,
    },
  ];

  it('generates a draft-07 style object schema with properties and required', () => {
    const schema = generateFormJsonSchema(minimalForm) as Record<string, unknown>;
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).toEqual(
      expect.objectContaining({
        email: expect.objectContaining({
          type: 'string',
          format: 'email',
          title: 'Email',
        }),
        agree: expect.objectContaining({
          type: 'boolean',
          title: 'I agree',
        }),
      }),
    );
    expect(schema.required).toEqual(['email']);
  });

  it('generates ui schema with titles, widgets, and ui:order', () => {
    const ui = generateFormUiSchema(minimalForm) as Record<string, unknown>;
    expect(ui['ui:order']).toEqual(['email', 'agree']);
    expect(ui.email).toMatchObject({
      'ui:title': 'Email',
    });
    expect(ui.agree).toMatchObject({
      'ui:title': 'I agree',
      'ui:widget': 'checkbox',
    });
  });
  it('generates a Priority field with the fixed priority enum and never requires it in content', () => {
    const elements: FormElementOrList[] = [
      {
        id: 'priority-field',
        name: 'request_priority',
        fieldType: 'Priority',
        label: 'Priority',
        required: true,
      },
    ];

    const schema = generateFormJsonSchema(elements) as Record<string, any>;
    expect(schema.properties.request_priority).toMatchObject({
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      enumNames: ['Low', 'Medium', 'High', 'Critical'],
      'x-field-type': 'Priority',
    });
    expect(schema.required ?? []).not.toContain('request_priority');

    const ui = generateFormUiSchema(elements) as Record<string, any>;
    expect(ui.request_priority).toMatchObject({
      'ui:title': 'Priority',
    });
  });

  it('generates MultiSelect as an array and uses the dedicated multiSelect RJSF widget', () => {
    const elements: FormElementOrList[] = [
      {
        id: 'tags-field',
        name: 'tags',
        fieldType: 'MultiSelect',
        label: 'Tags',
        placeholder: 'Choose tags',
        options: [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ],
        required: true,
      },
    ];

    const schema = generateFormJsonSchema(elements) as Record<string, any>;
    expect(schema.properties.tags).toMatchObject({
      type: 'array',
      uniqueItems: true,
      minItems: 1,
      items: { type: 'string', enum: ['one', 'two'], enumNames: ['One', 'Two'] },
    });

    const ui = generateFormUiSchema(elements) as Record<string, any>;
    expect(ui.tags).toMatchObject({
      'ui:widget': 'multiSelect',
      'ui:options': { placeholder: 'Choose tags' },
    });
  });

});
