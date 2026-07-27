import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import type { AuthUser } from '@/types/api';

vi.mock('@/api/auth');
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

const currentUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
};

describe('Settings page', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('renders page title and description', async () => {
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
    expect(
      screen.getByText('Manage your account settings and preferences.')
    ).toBeInTheDocument();
  });

  it('renders the Change Password card with its fields', async () => {
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(
        screen.getByText(
          (content, element) => content === 'Change Password' && element?.tagName !== 'BUTTON'
        )
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Update your password to keep your account secure.')
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(3);

    expect(screen.getByLabelText('Current Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('New Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm New Password')).toHaveAttribute('type', 'password');
  });

  it('shows validation errors when the form is submitted empty', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Current password is required')).toBeInTheDocument();
    });
    expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows a validation error when the new password is too short', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
    await user.type(screen.getByLabelText('New Password'), '123');
    await user.type(screen.getByLabelText('Confirm New Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();
    });
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it("shows a validation error when the passwords don't match", async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'differentpassword');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows an error toast and keeps the fields filled when the request fails', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValue({
      response: { data: { message: 'Current password is incorrect' } },
    });

    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'wrongpassword');
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Current password is incorrect');
    });

    expect(screen.getByLabelText('Current Password')).toHaveValue('wrongpassword');
    expect(screen.getByLabelText('New Password')).toHaveValue('newpassword123');
  });

  it('shows a fallback error toast message when the server provides none', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValue({});

    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'wrongpassword');
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to change password');
    });
  });

  it('disables the submit button and shows "Updating..." while the request is pending', async () => {
    let resolveChangePassword: (value?: unknown) => void = () => {};
    vi.mocked(authApi.changePassword).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveChangePassword = resolve;
        }) as any
    );

    const user = userEvent.setup();
    renderWithRouter({ route: '/settings', user: currentUser });
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
    await user.type(screen.getByLabelText('New Password'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
    });

    resolveChangePassword();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Change Password' })).not.toBeDisabled();
    });
  });
});
