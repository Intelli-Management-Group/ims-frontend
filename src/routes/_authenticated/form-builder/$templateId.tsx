import { createFileRoute } from '@tanstack/react-router';
import {
  FormBuilderDesktopLayout,
  FormBuilderMobileLayout,
  FormBuilderTabletLayout,
} from './components/form-builder-layout';
import { useEditFormBuilderPage } from './useEditFormBuilderPage';

export const Route = createFileRoute('/_authenticated/form-builder/$templateId')({
  component: EditFormBuilderPage,
});

function EditFormBuilderPage() {
  const { templateId } = Route.useParams();
  const { isMobile, isTablet, isLoading, headerProps } = useEditFormBuilderPage(templateId);

  if (isLoading) {
    return (
      <main className="h-[calc(100dvh-4rem)] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading template…</p>
      </main>
    );
  }

  if (isMobile) return <FormBuilderMobileLayout headerProps={headerProps} />;
  if (isTablet) return <FormBuilderTabletLayout headerProps={headerProps} />;
  return <FormBuilderDesktopLayout headerProps={headerProps} />;
}
