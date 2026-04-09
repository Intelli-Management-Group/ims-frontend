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
});
