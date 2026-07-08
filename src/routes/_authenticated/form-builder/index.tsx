import { createFileRoute } from '@tanstack/react-router';
import {
  FormBuilderDesktopLayout,
  FormBuilderMobileLayout,
  FormBuilderTabletLayout,
} from './components/form-builder-layout';
import { useFormBuilderPage } from './useFormBuilderPage';

export const Route = createFileRoute('/_authenticated/form-builder/')({
  component: FormBuilderPage,
});

function FormBuilderPage() {
  const { isMobile, isTablet, headerProps } = useFormBuilderPage();

  if (isMobile) return <FormBuilderMobileLayout headerProps={headerProps} />;
  if (isTablet) return <FormBuilderTabletLayout headerProps={headerProps} />;
  return <FormBuilderDesktopLayout headerProps={headerProps} />;
}
