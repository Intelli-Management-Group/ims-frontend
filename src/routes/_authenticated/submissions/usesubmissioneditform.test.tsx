import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import type { IChangeEvent } from '@rjsf/core';
import { useSubmissionEditForm, type SubmissionWithTemplate } from './useSubmissionEditForm';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function buildSubmission(overrides?: Partial<SubmissionWithTemplate>): SubmissionWithTemplate {
  return {
    id: 5,
    form_template_id: 10,
    current_version_id: 100,
    template: {
      id: 10,
      name: 'Contact Form',
      json_schema: {},
      ui_schema: {},
      is_active: true,
      created_by: 1,
      creator: null,
      created_at: '',
      updated_at: '',
    },
    current_version: {
      id: 100,
      submission_id: 5,
      user_id: 1,
      user: null,
      form_name: 'My filled form',
      content: { answer: 'hello' },
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '',
    updated_at: '',
    ...overrides,
  } as SubmissionWithTemplate;
}

describe('useSubmissionEditForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes formName from the current version', () => {
    const { result } = renderHook(() =>
      useSubmissionEditForm({ submission: buildSubmission(), onSave: vi.fn() }),
    );

    expect(result.current.formName).toBe('My filled form');
    expect(result.current.formNameError).toBe(false);
  });

  it('updates formName as the user types', () => {
    const { result } = renderHook(() =>
      useSubmissionEditForm({ submission: buildSubmission(), onSave: vi.fn() }),
    );

    act(() => {
      result.current.handleFormNameChange('Updated name');
    });

    expect(result.current.formName).toBe('Updated name');
  });

  it('clears an existing formNameError as soon as the user types again', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useSubmissionEditForm({ submission: buildSubmission(), onSave }),
    );

    // Trigger the error first via an empty-name submit.
    act(() => {
      result.current.handleFormNameChange('');
    });
    act(() => {
      result.current.handleSubmit({ formData: { answer: 'x' } } as IChangeEvent);
    });
    expect(result.current.formNameError).toBe(true);

    act(() => {
      result.current.handleFormNameChange('N');
    });

    expect(result.current.formNameError).toBe(false);
  });

  it('shows an error and does not save when formName is empty', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useSubmissionEditForm({ submission: buildSubmission(), onSave }),
    );

    act(() => {
      result.current.handleFormNameChange('   ');
    });
    act(() => {
      result.current.handleSubmit({ formData: { answer: 'x' } } as IChangeEvent);
    });

    expect(result.current.formNameError).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('Please enter a form name');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with trimmed name, content, pinned version number, and priority', () => {
    const onSave = vi.fn();

    const { result } = renderHook(() =>
      useSubmissionEditForm({
        submission: buildSubmission({
          current_version: {
            id: 100,
            submission_id: 5,
            user_id: 1,
            user: null,
            form_name: 'Original',
            content: {},
            version_number: 4,
            created_at: '',
            updated_at: '',
          },
          priority: undefined,
        }),
        onSave,
      }),
    );

    act(() => {
      result.current.handleFormNameChange('  Trimmed Name  ');
    });

    act(() => {
      result.current.handleSubmit({
        formData: { answer: 'updated' },
      } as IChangeEvent);
    });

    expect(onSave).toHaveBeenCalledWith({
      formName: 'Trimmed Name',
      content: { answer: 'updated' },
      versionNumber: 4,
      priority: null,
    });
  });

  it('calls onSave with the selected priority', () => {
    const onSave = vi.fn();

    const { result } = renderHook(() =>
      useSubmissionEditForm({
        submission: buildSubmission({
          priority: undefined,
        }),
        onSave,
      }),
    );

    act(() => {
      result.current.setPriority('medium');
    });

    act(() => {
      result.current.handleSubmit({
        formData: { answer: 'updated' },
      } as IChangeEvent);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'medium',
      }),
    );
  });
  
  it('does not call onSave when formData is undefined', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useSubmissionEditForm({ submission: buildSubmission(), onSave }),
    );

    act(() => {
      result.current.handleSubmit({ formData: undefined } as IChangeEvent);
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps using the version number pinned at mount even if unrelated state changes', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useSubmissionEditForm({
        submission: buildSubmission({
          current_version: {
            id: 100,
            submission_id: 5,
            user_id: 1,
            user: null,
            form_name: 'Original',
            content: {},
            version_number: 7,
            created_at: '',
            updated_at: '',
          },
        }),
        onSave,
      }),
    );

    act(() => {
      result.current.handleFormNameChange('Name');
      result.current.handleFormNameChange('Name again');
    });
    act(() => {
      result.current.handleSubmit({ formData: { a: 1 } } as IChangeEvent);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ versionNumber: 7 }),
    );
  });
});
