import { screen, userEvent, waitFor, within } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { fireEvent } from '@testing-library/react';
import { rolesApi } from '@/api/roles';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/roles');
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

const mockRolesList = {
  data: [
    { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
    { id: 2, name: 'manager', is_active: true, created_at: '', updated_at: '' },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, links: [], path: '', per_page: 10, to: 2, total: 2 },
};

describe('Roles page', () => {
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
    vi.mocked(rolesApi.getRoles).mockResolvedValue(mockRolesList);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('renders page title and description when authenticated', async () => {
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
    });
    expect(screen.getByText('Manage user roles')).toBeInTheDocument();
  });

  it('lists roles when API returns data', async () => {
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
    expect(screen.getByText('manager')).toBeInTheDocument();
    expect(rolesApi.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, search: '' })
    );
  });

  it('calls getRoles with search param when user types in search', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search roles...')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Search roles...'), 'manager');
    await waitFor(() => {
      expect(rolesApi.getRoles).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'manager' })
      );
    });
  });

  it('admin sees Add Role button enabled', async () => {
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add Role/i })).not.toBeDisabled();
  });

  it('opens Add Role dialog and shows validation error for short name', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Role/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Add Role/i })).toBeInTheDocument();
    });
    const nameInput = screen.getByPlaceholderText('Administrator');
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(rolesApi.createRole).not.toHaveBeenCalled();
  });

  it('calls createRole and closes dialog on successful create', async () => {
    vi.mocked(rolesApi.createRole).mockResolvedValue({
      id: 3,
      name: 'custom-role',
      is_active: true,
      created_at: '',
      updated_at: '',
    });
    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Role/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Administrator')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Administrator'), 'custom-role');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(rolesApi.createRole).toHaveBeenCalled();
      const call = vi.mocked(rolesApi.createRole).mock.calls[0];
      expect(call[0]).toMatchObject({ name: 'custom-role', is_active: true });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Add Role/i })).not.toBeInTheDocument();
    });
  });

  it('shows table headers Name, Status, Edit', async () => {
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('updates a role from the table actions', async () => {
    vi.mocked(rolesApi.updateRole).mockResolvedValue({
      id: 1,
      name: 'admin-updated',
      is_active: true,
      created_at: '',
      updated_at: '',
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: adminUser });

    const nameCell = await screen.findByText('admin');
    const row = nameCell.closest('tr') as HTMLElement;
    const editButton = within(row).getAllByRole('button')[0];

    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Edit Role/i })).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Administrator');
    expect(nameInput).toHaveValue('admin');
    await user.clear(nameInput);
    await user.type(nameInput, 'admin-updated');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(rolesApi.updateRole).toHaveBeenCalledTimes(1);
      const [id, payload] = vi.mocked(rolesApi.updateRole).mock.calls[0];
      expect(id).toBe(1);
      expect(payload).toMatchObject({ name: 'admin-updated', is_active: true });
    });
  });

  it('creates an inactive role when Active Status is toggled off', async () => {
    vi.mocked(rolesApi.createRole).mockResolvedValue({
      id: 3,
      name: 'inactive-role',
      is_active: false,
      created_at: '',
      updated_at: '',
    } as any);

    const user = userEvent.setup();

    renderWithRouter({ route: '/roles', user: adminUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add Role/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Administrator')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Administrator'), 'inactive-role');

    const activeSwitch = screen.getByRole('switch', { name: /Active Status/i });
    await user.click(activeSwitch);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(rolesApi.createRole).toHaveBeenCalled();
      const calls = vi.mocked(rolesApi.createRole).mock.calls;
      const [payload] = calls[calls.length - 1];
      expect(payload).toMatchObject({
        name: 'inactive-role',
        is_active: false,
      });
    });
  });

  it('shows an error toast when role creation fails', async () => {
    vi.mocked(rolesApi.createRole).mockRejectedValue({
      response: { data: { message: 'Role name already taken' } },
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: adminUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /Add Role/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Administrator')).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('Administrator'), 'duplicate-role');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Role name already taken');
    });
    expect(screen.getByRole('dialog', { name: /Add Role/i })).toBeInTheDocument();
  });

  it('non-admin sees Add Role disabled and cannot open the dialog', async () => {
    mockedUseAuth.mockReturnValue({
      user: nonAdminUser,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);

    const user = userEvent.setup();
    renderWithRouter({ route: '/roles', user: nonAdminUser });

    const addRoleButton = await screen.findByRole('button', { name: /Add Role/i });
    expect(addRoleButton).toBeDisabled();

    await user.click(addRoleButton);
    expect(screen.queryByRole('dialog', { name: /Add Role/i })).not.toBeInTheDocument();
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

    renderWithRouter({ route: '/roles', user: nonAdminUser });

    const nameCell = await screen.findByText('admin');
    const row = nameCell.closest('tr') as HTMLElement;
    const editButton = within(row).getAllByRole('button')[0];
    expect(editButton).toBeDisabled();
  });
});
