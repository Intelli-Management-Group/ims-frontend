import { screen, userEvent, waitFor } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import { authApi } from '@/api/auth';

describe('Login page', () => {
  beforeEach(() => {
    localStorage.removeItem('access_token');
    vi.mocked(authApi.login).mockReset();
  });

  it('renders IMS Login title and email/password fields', async () => {
    renderWithRouter({ route: '/login' });
    await waitFor(() => {
      expect(screen.getByText('IMS Login')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/login' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('admin@example.com'), 'invalid');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/login' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('admin@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), '12345');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('does not call authApi.login when validation fails', async () => {
    const user = userEvent.setup();
    renderWithRouter({ route: '/login' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('admin@example.com'), 'invalid');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('calls authApi.login and navigates on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'token', token_type: 'bearer', expires_in: 3600 });
    const user = userEvent.setup();
    const { router } = renderWithRouter({ route: '/login' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText('admin@example.com'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'password123' });
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });
});
