import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { formTemplatesApi } from '@/api/form-templates';
import { getStoredFormName, initializeFormBuilder } from '@/services/form-builder.service';
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

const savedTemplate: FormTemplate = {
  id: 99,
  name: 'Saved',
  json_schema: {},
  ui_schema: {},
  is_active: true,
  created_by: 1,
  creator: null,
  created_at: '',
  updated_at: '',
};

vi.mock('@/api/form-templates', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/api/form-templates')>();
  return {
    formTemplatesApi: {
      ...mod.formTemplatesApi,
      createFormTemplate: vi.fn(),
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

describe('Form Builder page', () => {
  beforeEach(() => {
    localStorage.clear();
    initializeFormBuilder();
    vi.mocked(formTemplatesApi.createFormTemplate).mockReset();
    vi.mocked(formTemplatesApi.createFormTemplate).mockResolvedValue(savedTemplate);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
  });

  it('renders Form Builder heading and editor/preview sections on desktop', async () => {
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Builder' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
  });

  it('saves template with name and schemas when Save is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Template name') as HTMLInputElement;
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);
    await user.type(nameInput, 'Contact form', { skipClick: true });
    expect(nameInput).toHaveValue('Contact form');
    expect(getStoredFormName()).toBe('Contact form');

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(vi.mocked(formTemplatesApi.createFormTemplate)).toHaveBeenCalledTimes(1);
    });

    expect(formTemplatesApi.createFormTemplate).toHaveBeenCalledWith({
      name: 'Contact form',
      json_schema: expect.objectContaining({
        type: 'object',
        additionalProperties: false,
      }),
      ui_schema: expect.any(Object),
      is_active: true,
    });
  });

  it('shows an error and does not call the API when saving with an empty name', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Enter a template name');
    });
    expect(formTemplatesApi.createFormTemplate).not.toHaveBeenCalled();
  });

  it('shows a saving state while the request is pending and a success toast when it resolves', async () => {
    let resolveSave: (value: FormTemplate) => void;
    vi.mocked(formTemplatesApi.createFormTemplate).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Template name') as HTMLInputElement;
    nameInput.focus();
    await user.type(nameInput, 'Contact form', { skipClick: true });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
    });

    resolveSave!(savedTemplate);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Template saved');
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Save$/i })).not.toBeDisabled();
    });
  });

  it('shows an error toast and re-enables Save when the request fails', async () => {
    vi.mocked(formTemplatesApi.createFormTemplate).mockRejectedValueOnce(new Error('network error'));

    const user = userEvent.setup();
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Template name')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Template name') as HTMLInputElement;
    nameInput.focus();
    await user.type(nameInput, 'Contact form', { skipClick: true });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save template');
    });
    expect(screen.getByRole('button', { name: /^Save$/i })).not.toBeDisabled();
  });

  it('renders the Form Builder sections on a mobile viewport', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(500);
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Builder' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
  });

  it('renders the Form Builder sections on a tablet viewport', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(900);
    renderWithRouter({ route: '/form-builder', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Builder' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
  });
});
