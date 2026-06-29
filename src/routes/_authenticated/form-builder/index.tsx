import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formTemplatesApi } from '@/api/form-templates';
import type { FormElementOrList } from '@/db-collections/form-builder.collections';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScreenSize } from '@/hooks/use-screen-size';
import useFormBuilderState from '@/hooks/use-form-builder-state';
import { generateFormJsonSchema, generateFormUiSchema } from '@/lib/schema-generators';
import { resetFormBuilder, setFormName } from '@/services/form-builder.service';
import {
  FormBuilderDesktopLayout,
  FormBuilderMobileLayout,
  FormBuilderTabletLayout,
} from './components/form-builder-layout';

export const Route = createFileRoute('/_authenticated/form-builder/')({
  component: FormBuilderPage,
});

function FormBuilderPage() {
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const isTablet = screenSize.lessThan('lg') && !isMobile;
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { formElements } = useFormBuilderState();

  useEffect(() => {
    resetFormBuilder();
    setTemplateName('');
  }, []);

  const handleTemplateNameChange = useCallback((value: string) => {
    setTemplateName(value);
    setFormName(value);
  }, []);

  const jsonSchema = useMemo(
    () => generateFormJsonSchema(formElements as unknown as FormElementOrList[]),
    [formElements],
  );
  const uiSchema = useMemo(
    () => generateFormUiSchema(formElements as unknown as FormElementOrList[]),
    [formElements],
  );

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      toast.error('Enter a template name');
      return;
    }
    setIsSaving(true);
    try {
      await formTemplatesApi.createFormTemplate({
        name: trimmedName,
        json_schema: jsonSchema as Record<string, unknown>,
        ui_schema: uiSchema as Record<string, unknown>,
        is_active: true,
      });
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, templateName, jsonSchema, uiSchema]);

  const headerProps = {
    templateName,
    onTemplateNameChange: handleTemplateNameChange,
    isSaving,
    onSave: handleSave,
  };

  if (isMobile) return <FormBuilderMobileLayout headerProps={headerProps} />;
  if (isTablet) return <FormBuilderTabletLayout headerProps={headerProps} />;
  return <FormBuilderDesktopLayout headerProps={headerProps} />;
}