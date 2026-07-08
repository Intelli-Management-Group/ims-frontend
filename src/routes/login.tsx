import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from './login-page';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});
