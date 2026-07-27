import { screen, userEvent, waitFor, within } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { teamsApi } from '@/api/teams';
import { departmentsApi } from '@/api/departments';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/teams');
vi.mock('@/api/departments');
vi.mock('@/hooks/use-auth', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/use-debounce', () => ({ useDebounce: (value: unknown) => value }));
vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: vi.fn(),
      error: vi.fn(),
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

const nonAdminUser: AuthUser = {
  ...adminUser,
  id: 2,
  name: 'Viewer',
  email: 'viewer@example.com',
  role: { id: 2, name: 'user', is_active: true, created_at: '', updated_at: '' },
};

const mockDepartments = {
  data: [{ id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' }],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 100, to: 1, total: 1 },
};

const mockTeamsList = {
  data: [
    {
      id: 1,
      name: 'Backend Alpha',
      department_id: 1,
      is_active: true,
      department: { id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 10, to: 1, total: 1 },
};

const mockTeamsListNoDepartment = {
  data: [
    {
      id: 2,
      name: 'Unassigned Crew',
      department_id: null,
      is_active: true,
      department: null,
      created_at: '',
      updated_at: '',
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 10, to: 1, total: 1 },
};

describe('Teams page', () => {
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);
    vi.mocked(teamsApi.getTeams).mockResolvedValue(mockTeamsList);
    vi.mocked(departmentsApi.getDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    });
    expect(screen.getByText("Manage your organization's teams")).toBeInTheDocument();
  });

  it('lists teams when API returns data', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Backend Alpha')).toBeInTheDocument();
    });
    expect(teamsApi.getTeams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, search: '' })
    );
  });

  it('calls getTeams with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search teams...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search teams...'), 'Backend');
    await waitFor(() => {
      expect(teamsApi.getTeams).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Backend' })
      );
    });
  });

  it('admin sees Add Team button enabled', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add Team/i })).not.toBeDisabled();
  });

  it('opens Add Team dialog and shows validation error for short name', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Team/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Team/i })).toBeInTheDocument();
    });
    const nameInput = screen.getByPlaceholderText('Frontend Team');
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(teamsApi.createTeam).not.toHaveBeenCalled();
  });

  it('shows table headers Name, Status, Edit', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows validation error when department is not selected', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add Team/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Team/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Frontend Team');
    await user.type(nameInput, 'Backend Beta');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Department is required')).toBeInTheDocument();
    });
    expect(teamsApi.createTeam).not.toHaveBeenCalled();
  });

  it('shows the Department column header', async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Department')).toBeInTheDocument();
  });

  it("renders a team's department name in the table", async () => {
    renderWithRouter({ route: '/teams', user: adminUser });
    const row = await screen.findByRole('row', { name: /Backend Alpha/i });
    expect(within(row).getByText('Engineering')).toBeInTheDocument();
  });

  it('creates a team when the form is valid', async () => {
    vi.mocked(teamsApi.createTeam).mockResolvedValue({
      id: 3,
      name: 'Frontend Squad',
      department_id: 1,
      is_active: true,
      department: { id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Team/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Team/i }));

    const dialog = await screen.findByRole('dialog', { name: /Add Team/i });
    await user.type(within(dialog).getByPlaceholderText('Frontend Team'), 'Frontend Squad');

    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));

    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(teamsApi.createTeam).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Frontend Squad', department_id: 1, is_active: true })
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Add Team/i })).not.toBeInTheDocument();
    });
  });

  it('toggles active status off before creating a team', async () => {
    vi.mocked(teamsApi.createTeam).mockResolvedValue({
      id: 4,
      name: 'Inactive Squad',
      department_id: 1,
      is_active: false,
      department: { id: 1, name: 'Engineering', is_active: true, created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await user.click(await screen.findByRole('button', { name: /Add Team/i }));

    const dialog = await screen.findByRole('dialog', { name: /Add Team/i });
    await user.type(within(dialog).getByPlaceholderText('Frontend Team'), 'Inactive Squad');
    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));
    await user.click(within(dialog).getByRole('switch'));

    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(teamsApi.createTeam).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false })
      );
    });
  });
 
  it('shows an error toast when team creation fails', async () => {
    vi.mocked(teamsApi.createTeam).mockRejectedValue({
      response: { data: { message: 'A team with this name already exists' } },
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: adminUser });
    await user.click(await screen.findByRole('button', { name: /Add Team/i }));

    const dialog = await screen.findByRole('dialog', { name: /Add Team/i });
    await user.type(within(dialog).getByPlaceholderText('Frontend Team'), 'Duplicate Team');
    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('A team with this name already exists');
    });
    expect(screen.getByRole('dialog', { name: /Add Team/i })).toBeInTheDocument();
  });

  it('non-admin sees Add Team disabled and cannot open the dialog', async () => {
    mockedUseAuth.mockReturnValue({
      user: nonAdminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);

    const user = userEvent.setup();
    renderWithRouter({ route: '/teams', user: nonAdminUser });

    const addTeamButton = await screen.findByRole('button', { name: /Add Team/i });
    expect(addTeamButton).toBeDisabled();

    await user.click(addTeamButton);
    expect(screen.queryByRole('dialog', { name: /Add Team/i })).not.toBeInTheDocument();
  });

  it('disables the edit action for non-admin users', async () => {
    mockedUseAuth.mockReturnValue({
      user: nonAdminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderWithRouter({ route: '/teams', user: nonAdminUser });
    const row = await screen.findByRole('row', { name: /Backend Alpha/i });
    const editButton = within(row).getByRole('button');
    expect(editButton).toBeDisabled();
  });

});
