import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { formTemplatesApi } from '@/api/form-templates';
import { getStoredFormName, initializeFormBuilder } from '@/services/form-builder.service';
import type { AuthUser, FormTemplate } from '@/types/api';

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
});
