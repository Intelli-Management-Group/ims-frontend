import { screen, userEvent, waitFor, within } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { useAuth } from '@/hooks/use-auth';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/users');
vi.mock('@/api/departments');
vi.mock('@/api/teams');
vi.mock('@/api/roles');
vi.mock('@/hooks/use-auth', () => ({ useAuth: vi.fn() }));
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

const mockTeams = {
  data: [
    { id: 1, name: 'Backend', department_id: 1, is_active: true, department: null, created_at: '', updated_at: '' },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 100, to: 1, total: 1 },
};

const mockRoles = {
  data: [
    { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
    { id: 2, name: 'user', is_active: true, created_at: '', updated_at: '' },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 100, to: 2, total: 2 },
};

const mockUsersList = {
  data: [
    {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      is_active: true,
      departments: [],
      teams: [],
      role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
      created_at: '',
      updated_at: '',
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 10, to: 1, total: 1 },
};

describe('Users page', () => {
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    vi.mocked(authApi.me).mockResolvedValue(null);
    mockedUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);
    vi.mocked(usersApi.getUsers).mockResolvedValue(mockUsersList);
    vi.mocked(departmentsApi.getDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(teamsApi.getTeams).mockResolvedValue(mockTeams);
    vi.mocked(rolesApi.getRoles).mockResolvedValue(mockRoles);
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });
    expect(screen.getByText('Manage user accounts')).toBeInTheDocument();
  });

  it('lists users when API returns data', async () => {
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, per_page: 10, search: '' })
      );
    });
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(within(table).getByText('admin@example.com')).toBeInTheDocument();
  });

  it('calls getUsers with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search users...'), 'Admin');
    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Admin' })
      );
    });
  });

  it('admin sees Add User button enabled', async () => {
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add User/i })).not.toBeDisabled();
  });

  it('non-admin sees Add User disabled and cannot open the dialog', async () => {
    const user = userEvent.setup();
    mockedUseAuth.mockReturnValue({
      user: nonAdminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderWithRouter({ route: '/users', user: nonAdminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });

    const addUserButton = screen.getByRole('button', { name: /Add User/i });
    await waitFor(() => {
      expect(addUserButton).toBeDisabled();
    });

    await user.click(addUserButton);

    expect(screen.queryByRole('dialog', { name: /Add User/i })).not.toBeInTheDocument();
  });

  it('disables edit actions for non-admin users', async () => {
    mockedUseAuth.mockReturnValue({
      user: nonAdminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderWithRouter({ route: '/users', user: nonAdminUser });

    await screen.findAllByText('admin@example.com');

    const table = screen.getByRole('table');
    const row = within(table)
      .getAllByRole('row')
      .find((candidate) => within(candidate).queryByText('admin@example.com') !== null);

    expect(row).toBeDefined();
    const editButton = within(row as HTMLElement).getByRole('button', { name: /Edit Admin/i });
    expect(editButton).toBeDisabled();
  });

  it('opens Add User dialog and shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('John Doe'), 'New User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'invalid-email');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
    expect(usersApi.createUser).not.toHaveBeenCalled();
  });

  it('opens Add User dialog and shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('John Doe'), 'New User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), '12345');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
    expect(usersApi.createUser).not.toHaveBeenCalled();
  });

  it('shows table headers Name, Email, Status, Edit', async () => {
    renderWithRouter({ route: '/users', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('creates a user when form is valid', async () => {
    vi.mocked(usersApi.createUser).mockResolvedValue({
      id: 2,
      name: 'New User',
      email: 'new@example.com',
      is_active: true,
      departments: [],
      teams: [],
      role: null,
      created_at: '',
      updated_at: '',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/users', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('John Doe'), 'New User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'new@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(usersApi.createUser).toHaveBeenCalledTimes(1);
      expect(usersApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New User',
          email: 'new@example.com',
          is_active: true,
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Add User/i })).not.toBeInTheDocument();
    });
  });

  it('updates a user without sending empty password', async () => {
    vi.mocked(usersApi.updateUser).mockResolvedValue({
      ...mockUsersList.data[0],
      name: 'Updated Admin',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/users', user: adminUser });

    await screen.findAllByText('admin@example.com');

    const row = screen.getByRole('row', { name: /admin@example.com/i });
    const editButton = within(row).getAllByRole('button')[0];

    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Edit User/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Admin');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(usersApi.updateUser).toHaveBeenCalledTimes(1);
      const [id, payload] = vi.mocked(usersApi.updateUser).mock.calls[0];
      expect(id).toBe(1);
      expect(payload).not.toHaveProperty('password');
      expect(payload).toMatchObject({ name: 'Updated Admin' });
    });
  });

});
