import { screen, userEvent, waitFor, within } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { formTemplatesApi } from '@/api/form-templates';
import * as useAuthModule from '@/hooks/use-auth';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/form-templates');
vi.mock('@/hooks/use-debounce', () => ({ useDebounce: (value: unknown) => value }));

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
};

const memberUser: AuthUser = {
  id: 2,
  name: 'Member',
  email: 'member@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: { id: 2, name: 'member', is_active: true, created_at: '', updated_at: '' },
};

const mockTemplatesList = {
  data: [
    {
      id: 1,
      name: 'Registration',
      json_schema: {},
      ui_schema: {},
      is_active: true,
      created_by: 1,
      creator: { id: 1, name: 'Admin', email: 'a@x.com', is_active: true, created_at: '', updated_at: '' },
      created_at: '2025-01-01T00:00:00.000000Z',
      updated_at: '2025-01-02T00:00:00.000000Z',
    },
    {
      id: 2,
      name: 'Survey',
      json_schema: {},
      ui_schema: {},
      is_active: true,
      created_by: 1,
      creator: null,
      created_at: '2025-01-01T00:00:00.000000Z',
      updated_at: '2025-01-03T00:00:00.000000Z',
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    links: [],
    path: '',
    per_page: 10,
    to: 2,
    total: 2,
  },
};

describe('Form Templates page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(formTemplatesApi.getFormTemplates).mockResolvedValue(mockTemplatesList);
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Form Templates' })).toBeInTheDocument();
    });
    expect(screen.getByText('Manage reusable form definitions')).toBeInTheDocument();
  });

  it('lists templates when API returns data', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Registration')).toBeInTheDocument();
    });
    expect(screen.getByText('Survey')).toBeInTheDocument();
    expect(formTemplatesApi.getFormTemplates).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, search: '' })
    );
  });

  it('calls getFormTemplates with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search form templates...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search form templates...'), 'Reg');
    await waitFor(() => {
      expect(formTemplatesApi.getFormTemplates).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Reg' })
      );
    });
  });

  it('admin sees Add Template as a link to the form builder', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Add Template/i })).toBeInTheDocument();
    });
    const link = screen.getByRole('link', { name: /Add Template/i });
    expect(link).toHaveAttribute('href', '/form-builder');
  });

  it('non-admin sees Add Template button disabled', async () => {
    const useAuthSpy = vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: memberUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    });
    try {
      renderWithRouter({ route: '/form-templates', user: memberUser });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Template/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Add Template/i })).toBeDisabled();
      expect(screen.queryByRole('link', { name: /Add Template/i })).not.toBeInTheDocument();
    } finally {
      useAuthSpy.mockRestore();
    }
  });

  it('shows table headers', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('shows a dash for the "Created by" column when a template has no creator', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Survey')).toBeInTheDocument();
    });
    const surveyRow = screen.getByText('Survey').closest('tr');
    expect(surveyRow).not.toBeNull();
    expect(within(surveyRow as HTMLElement).getByText('—')).toBeInTheDocument();
  });

  it('admin sees an edit action for every row linking to the correct form builder route', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Registration')).toBeInTheDocument();
    });

    const editLinks = screen.getAllByRole('link', { name: 'Edit' });
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', '/form-builder/1');
    expect(editLinks[1]).toHaveAttribute('href', '/form-builder/2');
  });

  it('non-admin does not see an edit action column', async () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: memberUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    });
    try {
      renderWithRouter({ route: '/form-templates', user: memberUser });
      await waitFor(() => {
        expect(screen.getByText('Registration')).toBeInTheDocument();
      });
      expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
      // 4 data columns (Name, Status, Created by, Updated) and no actions column
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('admin table includes the actions column header', async () => {
    renderWithRouter({ route: '/form-templates', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Registration')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  });
});
