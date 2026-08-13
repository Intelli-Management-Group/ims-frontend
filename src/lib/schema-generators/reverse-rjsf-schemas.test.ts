import { reverseMapRjsfToFormElements } from './reverse-rjsf-schemas';

describe('reverseMapRjsfToFormElements', () => {
  it('reconstructs form elements, arrays, and enum-driven controls from JSON schema and UI schema', () => {
    const jsonSchema = {
      type: 'object',
      required: ['name', 'password', 'people'],
      properties: {
        name: {
          type: 'string',
          title: 'Name',
          description: 'Your name',
        },
        password: {
          type: 'string',
          title: 'Password',
        },
        age: {
          type: 'number',
          title: 'Age',
        },
        status: {
          type: 'string',
          title: 'Status',
          enum: ['draft', 'published'],
          enumNames: ['Draft', 'Published'],
        },
        consent: {
          type: 'boolean',
          title: 'Consent',
        },
        people: {
          type: 'array',
          title: 'People',
          items: {
            type: 'object',
            required: ['firstName'],
            properties: {
              firstName: {
                type: 'string',
                title: 'First name',
              },
              lastName: {
                type: 'string',
                title: 'Last name',
              },
            },
          },
        },
      },
    };

    const uiSchema = {
      'ui:order': ['name', 'password', 'age', 'status', 'consent', 'people'],
      password: {
        'ui:widget': 'password',
      },
      name: {
        'ui:widget': 'textarea',
      },
      status: {
        'ui:widget': 'radio',
      },
      people: {
        items: {
          'ui:order': ['lastName', 'firstName'],
        },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result).toHaveLength(6);

    const byName = new Map(result.map((element) => [element.name, element]));

    expect(byName.get('name')).toMatchObject({
      fieldType: 'Textarea',
      label: 'Name',
      required: true,
    });
    expect(byName.get('password')).toMatchObject({
      fieldType: 'Password',
      type: 'password',
      required: true,
    });
    expect(byName.get('age')).toMatchObject({
      fieldType: 'Input',
      type: 'number',
    });
    expect(byName.get('status')).toMatchObject({
      fieldType: 'RadioGroup',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    });
    expect(byName.get('consent')).toMatchObject({
      fieldType: 'Checkbox',
      required: false,
    });

    const people = byName.get('people');
    expect(people).toMatchObject({
      fieldType: 'FormArray',
      name: 'people',
      required: true,
    });
    expect((people as { arrayField: Array<{ name: string }> }).arrayField.map((field) => field.name)).toEqual([
      'lastName',
      'firstName',
    ]);
  });
});

describe('reverseMapRjsfToFormElements - date/time pickers', () => {
  it('reconstructs a DatePicker from type=string, format=date', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        birthday: { type: 'string', format: 'date', title: 'Birthday' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'birthday',
      fieldType: 'DatePicker',
      label: 'Birthday',
    });
  });

  it('reconstructs a TimePicker from type=string, format=time', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        meetingTime: { type: 'string', format: 'time', title: 'Meeting Time' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'meetingTime',
      fieldType: 'TimePicker',
      label: 'Meeting Time',
    });
  });

  it('reconstructs a DateRangePicker from a top-level object with start/end properties', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        eventWindow: {
          type: 'object',
          title: 'Event Window',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
          },
        },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'eventWindow',
      fieldType: 'DateRangePicker',
      label: 'Event Window',
    });
  });
});

describe('reverseMapRjsfToFormElements - OTP and Slider', () => {
  it('reconstructs an OTP field from equal minLength/maxLength and ui:options.inputType=password', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        otp: { type: 'string', title: 'OTP Code', minLength: 6, maxLength: 6 },
      },
    };
    const uiSchema = {
      otp: { 'ui:options': { inputType: 'password' } },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'otp',
      fieldType: 'OTP',
      maxLength: 6,
    });
  });

  it('reconstructs a Slider from type=integer, ui:widget=range', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        volume: { type: 'integer', title: 'Volume', minimum: 0, maximum: 11 },
      },
    };
    const uiSchema = {
      volume: { 'ui:widget': 'range' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'volume',
      fieldType: 'Slider',
      min: 0,
      max: 11,
    });
  });

  it('falls back to Slider defaults (min=1, max=100) when minimum/maximum are absent', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        intensity: { type: 'integer', title: 'Intensity' },
      },
    };
    const uiSchema = {
      intensity: { 'ui:widget': 'range' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result[0]).toMatchObject({
      fieldType: 'Slider',
      min: 1,
      max: 100,
    });
  });
});

describe('reverseMapRjsfToFormElements - text inputs', () => {
  it('reconstructs an email Input from format=email', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', title: 'Email' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result[0]).toMatchObject({
      name: 'email',
      fieldType: 'Input',
      type: 'email',
    });
  });

  it('carries a ui:placeholder through to a plain text Input', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        nickname: { type: 'string', title: 'Nickname' },
      },
    };
    const uiSchema = {
      nickname: { 'ui:placeholder': 'Enter nickname' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result[0]).toMatchObject({
      name: 'nickname',
      fieldType: 'Input',
      type: 'text',
      placeholder: 'Enter nickname',
    });
  });

  it('omits placeholder entirely when none is set', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        nickname: { type: 'string', title: 'Nickname' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result[0]).not.toHaveProperty('placeholder');
  });
});

describe('reverseMapRjsfToFormElements - enum-driven scalar controls', () => {
  it('reconstructs a Select with ui:widget=select', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        country: {
          type: 'string',
          title: 'Country',
          enum: ['us', 'uk'],
          enumNames: ['US', 'UK'],
        },
      },
    };
    const uiSchema = {
      country: { 'ui:widget': 'select' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result[0]).toMatchObject({
      fieldType: 'Select',
      placeholder: '',
      options: [
        { value: 'us', label: 'US' },
        { value: 'uk', label: 'UK' },
      ],
    });
  });

  it('defaults enum strings without a widget to Select, using raw values as labels when enumNames is absent', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        role: { type: 'string', title: 'Role', enum: ['admin', 'user'] },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result[0]).toMatchObject({
      fieldType: 'Select',
      options: [
        { value: 'admin', label: 'admin' },
        { value: 'user', label: 'user' },
      ],
    });
  });
});

describe('reverseMapRjsfToFormElements - array-based multi controls', () => {
  it('reconstructs a MultiSelect from an array using the dedicated multiSelect widget', () => {
    const result = reverseMapRjsfToFormElements(
      {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['one', 'two'],
              enumNames: ['One', 'Two'],
            },
          },
        },
      },
      {
        tags: { 'ui:widget': 'multiSelect' },
      },
    );

    expect(result).toEqual([
      expect.objectContaining({
        name: 'tags',
        fieldType: 'MultiSelect',
        options: [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ],
      }),
    ]);
  });

  it('reconstructs a MultiSelect from an array of enum strings with ui:widget=select', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          title: 'Tags',
          items: { type: 'string', enum: ['a', 'b', 'c'], enumNames: ['A', 'B', 'C'] },
        },
      },
    };
    const uiSchema = {
      tags: { 'ui:widget': 'select' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result[0]).toMatchObject({
      fieldType: 'MultiSelect',
      placeholder: '',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
    });
  });

  it('falls back to MultiSelect for an array of enum strings with no widget specified', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          title: 'Categories',
          items: { type: 'string', enum: ['x', 'y'] },
        },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result[0]).toMatchObject({
      fieldType: 'MultiSelect',
      options: [
        { value: 'x', label: 'x' },
        { value: 'y', label: 'y' },
      ],
    });
  });

  it('reconstructs a multiple ToggleGroup from an array of enum strings with ui:widget=checkboxes', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        interests: {
          type: 'array',
          title: 'Interests',
          items: { type: 'string', enum: ['sports', 'music'], enumNames: ['Sports', 'Music'] },
        },
      },
    };
    const uiSchema = {
      interests: { 'ui:widget': 'checkboxes' },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, uiSchema);

    expect(result[0]).toMatchObject({
      fieldType: 'ToggleGroup',
      type: 'multiple',
      options: [
        { value: 'sports', label: 'Sports' },
        { value: 'music', label: 'Music' },
      ],
    });
  });

  it('skips an array of plain strings with no enum entirely', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        notes: { type: 'array', title: 'Notes', items: { type: 'string' } },
        name: { type: 'string', title: 'Name' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result).toHaveLength(1);
    expect(result.map((el) => el.name)).toEqual(['name']);
  });
});

describe('reverseMapRjsfToFormElements - ordering fallbacks', () => {
  it('falls back to property insertion order when ui:order is absent', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        zeta: { type: 'string', title: 'Zeta' },
        alpha: { type: 'string', title: 'Alpha' },
        beta: { type: 'string', title: 'Beta' },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result.map((el) => el.name)).toEqual(['zeta', 'alpha', 'beta']);
  });

  it('falls back to item property insertion order for a FormArray when items ui:order is absent, and derives per-item required flags', () => {
    const jsonSchema = {
      type: 'object',
      properties: {
        addresses: {
          type: 'array',
          title: 'Addresses',
          items: {
            type: 'object',
            required: ['city'],
            properties: {
              city: { type: 'string', title: 'City' },
              zip: { type: 'string', title: 'Zip' },
            },
          },
        },
      },
    };

    const result = reverseMapRjsfToFormElements(jsonSchema, undefined);

    expect(result).toHaveLength(1);
    const addresses = result[0] as unknown as {
      fieldType: string;
      required: boolean;
      arrayField: Array<{ name: string; required: boolean }>;
    };
    expect(addresses.fieldType).toBe('FormArray');
    expect(addresses.required).toBe(false);
    expect(addresses.arrayField.map((f) => f.name)).toEqual(['city', 'zip']);

    const byName = new Map(addresses.arrayField.map((f) => [f.name, f]));
    expect(byName.get('city')?.required).toBe(true);
    expect(byName.get('zip')?.required).toBe(false);
  });
});

describe('reverseMapRjsfToFormElements - invalid or empty input', () => {
  it('returns an empty array for null/undefined schema', () => {
    expect(reverseMapRjsfToFormElements(null, undefined)).toEqual([]);
    expect(reverseMapRjsfToFormElements(undefined, undefined)).toEqual([]);
  });

  it('returns an empty array when properties are missing', () => {
    expect(reverseMapRjsfToFormElements({}, undefined)).toEqual([]);
    expect(reverseMapRjsfToFormElements({ type: 'object' }, undefined)).toEqual([]);
  });

  it('returns an empty array when properties is an empty object', () => {
    expect(
      reverseMapRjsfToFormElements({ type: 'object', properties: {} }, undefined),
    ).toEqual([]);
  });

  it('returns an empty array when the schema is an array rather than an object', () => {
    expect(reverseMapRjsfToFormElements([], undefined)).toEqual([]);
  });
});
