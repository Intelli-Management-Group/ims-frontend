import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formTemplatesApi } from '@/api/form-templates';
import type { FormElementOrList } from '@/db-collections/form-builder.collections';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScreenSize } from '@/hooks/use-screen-size';
import useFormBuilderState from '@/hooks/use-form-builder-state';
import { generateFormJsonSchema, generateFormUiSchema } from '@/lib/schema-generators';
import { resetFormBuilder, setFormName } from '@/services/form-builder.service';
import axios from 'axios';
import type { PermissionGrantDraft } from './components/usePermissionsPanel';

export function useFormBuilderPage() {
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const isTablet = screenSize.lessThan('lg') && !isMobile;
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [pendingPermissionDrafts, setPendingPermissionDrafts] = useState<PermissionGrantDraft[]>([]);
  const { formElements } = useFormBuilderState();

  useEffect(() => {
    resetFormBuilder();
    setTemplateName('');
    setPendingPermissionDrafts([]);

    return () => {
      resetFormBuilder();
      setTemplateName('');
      setPendingPermissionDrafts([]);
    };
  }, []);

  const handleTemplateNameChange = useCallback((value: string) => {
    setTemplateName(value);
    setFormName(value);
  }, []);

  const handlePermissionDraftChange = useCallback((grants: PermissionGrantDraft[]) => {
    setPendingPermissionDrafts(grants);
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
      const createdTemplate = await formTemplatesApi.createFormTemplate({
        name: trimmedName,
        json_schema: jsonSchema as Record<string, unknown>,
        ui_schema: uiSchema as Record<string, unknown>,
        is_active: true,
      });

      if (pendingPermissionDrafts.length > 0) {
        await Promise.all(
          pendingPermissionDrafts.map((grant) =>
            formTemplatesApi.createTemplatePermission(createdTemplate.id, {
              action: grant.action,
              permissible_type: grant.permissible_type,
              permissible_id: grant.permissible_id,
            }),
          ),
        );
        setPendingPermissionDrafts([]);
      }

      toast.success('Template saved');
    } catch (error) {
        if (axios.isAxiosError(error)) {
          const response = error.response?.data;

          if (response?.errors) {
            Object.values(response.errors)
              .flat()
              .forEach((message) => {
                toast.error(String(message));
              });
            return;
          }

          toast.error(response?.message ?? "Failed to save template");
          return;
        }
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, templateName, jsonSchema, uiSchema, pendingPermissionDrafts]);

  const headerProps = useMemo(
    () => ({
      templateName,
      onTemplateNameChange: handleTemplateNameChange,
      isSaving,
      onSave: handleSave,
    }),
    [templateName, handleTemplateNameChange, isSaving, handleSave],
  );

  return { isMobile, isTablet, headerProps, onPermissionDraftChange: handlePermissionDraftChange };
}
