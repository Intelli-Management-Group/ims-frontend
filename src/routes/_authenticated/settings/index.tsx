import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordField } from './password-field';
import { useSettingsPage } from './useSettingsPage';

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const { form, isPending } = useSettingsPage();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="current_password"
              children={(field) => <PasswordField field={field} label="Current Password" />}
            />
            <form.Field
              name="password"
              children={(field) => <PasswordField field={field} label="New Password" />}
            />
            <form.Field
              name="password_confirmation"
              children={(field) => <PasswordField field={field} label="Confirm New Password" />}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
