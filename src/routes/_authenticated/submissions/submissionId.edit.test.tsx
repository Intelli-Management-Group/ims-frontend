import { cleanup } from '@testing-library/react';
import axios from 'axios';
import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { formSubmissionsApi } from '@/api/form-submissions';
import { toast } from 'sonner';
import type { AuthUser, FormSubmission } from '@/types/api';

vi.mock('@/api/form-submissions', () => ({
  formSubmissionsApi: {
    getFormSubmissions: vi.fn(),
    getFormSubmission: vi.fn(),
    createFormSubmission: vi.fn(),
    updateFormSubmission: vi.fn(),
  },
}));

vi.mock('@/api/form-templates', () => ({
  formTemplatesApi: {
    getMyTemplatePermissions: vi.fn().mockResolvedValue({
      data: { form_template_id: 10, permissions: { view: true, create: true, edit: true } },
    }),
  },
}));

vi.mock('@/hooks/use-breadcrumb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-breadcrumb')>();
  return {
    ...actual,
    useBreadcrumb: vi.fn(() => ({
      overrides: null,
      setBreadcrumbs: vi.fn(),
    })),
  };
});

vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: Object.assign(actual.toast, {
      success: vi.fn(),
      error: vi.fn(),
    }),
  };
});

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
};

const jsonSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string', title: 'Answer' },
  },
};

function buildMockSubmission(overrides?: Partial<FormSubmission>): FormSubmission {
  return {
    id: 5,
    form_template_id: 10,
    current_version_id: 100,
    template: {
      id: 10,
      name: 'Contact Form',
      json_schema: jsonSchema,
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
  };
}

describe('Submission edit page', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.mocked(formSubmissionsApi.getFormSubmission).mockReset();
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('loads submission and shows template title and form name', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildMockSubmission());

    renderWithRouter({ route: '/submissions/5/edit', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contact Form' })).toBeInTheDocument();
    });
    expect(screen.getByText('Update the form below and save your changes.')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Form Name/i) as HTMLInputElement;
    expect(nameInput).toHaveValue('My filled form');

    expect(formSubmissionsApi.getFormSubmission).toHaveBeenCalledWith(5);
  });

  it('calls updateFormSubmission with form_name, content, and version_number on save', async () => {
    const user = userEvent.setup();
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildMockSubmission());
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockResolvedValue(
      buildMockSubmission({
        current_version: {
          id: 101,
          submission_id: 5,
          user_id: 1,
          user: null,
          form_name: 'My filled form',
          content: { answer: 'updated' },
          version_number: 3,
          created_at: '',
          updated_at: '',
        },
        current_version_id: 101,
      }),
    );

    renderWithRouter({ route: '/submissions/5/edit', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contact Form' })).toBeInTheDocument();
    });

    const answerInput = await screen.findByLabelText(/Answer/i);
    await user.clear(answerInput);
    await user.type(answerInput, 'updated');

    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      expect(formSubmissionsApi.updateFormSubmission).toHaveBeenCalledWith(5, {
        form_name: 'My filled form',
        content: { answer: 'updated' },
        version_number: 2,
      });
    });
  });

  it('shows success toast and navigates to submission detail on successful update', async () => {
    const user = userEvent.setup();
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildMockSubmission());
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockResolvedValue(
      buildMockSubmission({
        current_version: {
          id: 101,
          submission_id: 5,
          user_id: 1,
          user: null,
          form_name: 'My filled form',
          content: { answer: 'hello' },
          version_number: 3,
          created_at: '',
          updated_at: '',
        },
        current_version_id: 101,
      }),
    );

    const { router } = renderWithRouter({ route: '/submissions/5/edit', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Submission updated successfully');
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/submissions/5');
    });
  });

  it('shows conflict toast when API returns 409', async () => {
    const user = userEvent.setup();
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildMockSubmission());

    const conflictError = new axios.AxiosError(
      'Conflict',
      '409',
      {} as never,
      {},
      {
        status: 409,
        statusText: 'Conflict',
        data: {},
        headers: {},
        config: {} as never,
      },
    );
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockRejectedValue(conflictError);

    renderWithRouter({ route: '/submissions/5/edit', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This submission was updated elsewhere. Refresh the page and try again.',
      );
    });
  });

  it('shows generic error toast on non-409 update failure', async () => {
    const user = userEvent.setup();
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildMockSubmission());
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockRejectedValue(new Error('Network down'));

    renderWithRouter({ route: '/submissions/5/edit', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update submission');
    });
  });

  it('defers the edit form until submission is loaded', async () => {
    let resolveLoad!: (value: FormSubmission) => void;
    const loadPromise = new Promise<FormSubmission>((resolve) => {
      resolveLoad = resolve;
    });
    vi.mocked(formSubmissionsApi.getFormSubmission).mockImplementation(() => loadPromise);

    renderWithRouter({ route: '/submissions/99/edit', user: adminUser });

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmission).toHaveBeenCalledWith(99);
    });
    expect(screen.queryByLabelText(/Form Name/i)).not.toBeInTheDocument();

    resolveLoad(
      buildMockSubmission({
        id: 99,
        current_version: {
          id: 100,
          submission_id: 99,
          user_id: 1,
          user: null,
          form_name: 'Deferred form',
          content: { answer: 'hello' },
          version_number: 1,
          created_at: '',
          updated_at: '',
        },
      }),
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contact Form' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Form Name/i)).toHaveValue('Deferred form');
  });
});
