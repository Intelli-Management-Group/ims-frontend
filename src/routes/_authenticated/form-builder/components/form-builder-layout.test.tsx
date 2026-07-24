import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { formTemplatesApi } from '@/api/form-templates';
import { toast } from 'sonner';
import type { AuthUser, FormTemplate } from '@/types/api';

vi.mock('sonner', async (importOriginal) => {
  const mod = await importOriginal<typeof import('sonner')>();
  return {
    ...mod,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock('@/api/form-templates', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/api/form-templates')>();
  return {
    formTemplatesApi: {
      ...mod.formTemplatesApi,
      getFormTemplate: vi.fn(),
      updateFormTemplate: vi.fn(),
    },
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

const loadedTemplate: FormTemplate = {
  id: 42,
  name: 'Registration',
  json_schema: { type: 'object', properties: {}, additionalProperties: false },
  ui_schema: {},
  is_active: true,
  created_by: 1,
  creator: null,
  current_version: {
    id: 1,
    form_template_id: 42,
    version_number: 1,
    created_at: '',
    updated_at: '',
  },
  created_at: '',
  updated_at: '',
};

describe('Edit Form Builder page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(formTemplatesApi.getFormTemplate).mockReset();
    vi.mocked(formTemplatesApi.updateFormTemplate).mockReset();
    vi.mocked(formTemplatesApi.updateFormTemplate).mockResolvedValue(loadedTemplate);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
  });

  it('shows a loading state while the template is being fetched', async () => {
    let resolveGet: (value: FormTemplate) => void;
    vi.mocked(formTemplatesApi.getFormTemplate).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    expect(await screen.findByText('Loading template…')).toBeInTheDocument();

    resolveGet!(loadedTemplate);

    await waitFor(() => {
      expect(screen.queryByText('Loading template…')).not.toBeInTheDocument();
    });
  });

  it('loads the template and populates the name field once fetched', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(42);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });
  });

  it('shows an error and does not attempt to fetch when the templateId is not numeric', async () => {
    renderWithRouter({ route: '/form-builder/not-a-number', user: adminUser });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid template ID');
    });
    expect(formTemplatesApi.getFormTemplate).not.toHaveBeenCalled();

    // Navigation away from the invalid edit route should land back on the templates list.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Templates' })).toBeInTheDocument();
    });
  });

  it('shows an error and navigates back to the list when the template fails to load', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockRejectedValueOnce(new Error('not found'));

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load template');
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Templates' })).toBeInTheDocument();
    });
  });

  it('saves the updated template (without is_active) when Save is clicked', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);
    const user = userEvent.setup();

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });

    const nameInput = screen.getByLabelText('Template name') as HTMLInputElement;
    nameInput.focus();
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated name', { skipClick: true });
    expect(nameInput).toHaveValue('Updated name');

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(formTemplatesApi.updateFormTemplate).toHaveBeenCalledTimes(1);
    });

    expect(formTemplatesApi.updateFormTemplate).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        name: 'Updated name',
        json_schema: expect.any(Object),
        ui_schema: expect.any(Object),
        version_number: 1,
      }),
    );
    // The edit flow must not send is_active — only create does.
    const [, payload] = vi.mocked(formTemplatesApi.updateFormTemplate).mock.calls[0];
    expect(payload).not.toHaveProperty('is_active');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Template updated');
    });
  });

  it('shows an error and does not call the API when saving with an empty name', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);
    const user = userEvent.setup();

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });

    const nameInput = screen.getByLabelText('Template name') as HTMLInputElement;
    nameInput.focus();
    await user.clear(nameInput);

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Enter a template name');
    });
    expect(formTemplatesApi.updateFormTemplate).not.toHaveBeenCalled();
  });

  it('shows a saving state while the update is pending and re-enables Save on failure', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);
    vi.mocked(formTemplatesApi.updateFormTemplate).mockRejectedValueOnce(new Error('network error'));
    const user = userEvent.setup();

    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update template');
    });
    expect(screen.getByRole('button', { name: /^Save$/i })).not.toBeDisabled();
  });

  it('updates version_number after save so second consecutive save uses incremented version', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);
    vi.mocked(formTemplatesApi.updateFormTemplate).mockResolvedValueOnce({
      ...loadedTemplate,
      current_version: {
        id: 2,
        form_template_id: 42,
        version_number: 2,
        created_at: '',
        updated_at: '',
      },
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(formTemplatesApi.updateFormTemplate).toHaveBeenNthCalledWith(
        1,
        42,
        expect.objectContaining({ version_number: 1 }),
      );
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(formTemplatesApi.updateFormTemplate).toHaveBeenNthCalledWith(
        2,
        42,
        expect.objectContaining({ version_number: 2 }),
      );
    });
  });

  it('shows 409 conflict message when backend returns 409 version conflict', async () => {
    vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(loadedTemplate);
    const error409 = {
      isAxiosError: true,
      response: { status: 409 },
    };
    vi.mocked(formTemplatesApi.updateFormTemplate).mockRejectedValueOnce(error409);

    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder/42', user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toHaveValue('Registration');
    });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This template was modified by someone else. Reload to get the latest version.',
      );
    });
  });
});
