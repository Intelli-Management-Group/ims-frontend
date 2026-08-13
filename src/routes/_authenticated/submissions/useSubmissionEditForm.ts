import { useState } from 'react';
import type { IChangeEvent } from '@rjsf/core';
import { toast } from 'sonner';
import type { FormSubmission, FormSubmissionVersion, FormTemplate } from '@/types/api';
import { getPriorityFieldKey } from '@/lib/priority-field';

export type SubmissionWithTemplate = FormSubmission & {
  template: FormTemplate;
  current_version: FormSubmissionVersion;
};

interface UseSubmissionEditFormArgs {
  submission: SubmissionWithTemplate;
  onSave: (payload: {
    formName: string;
    content: Record<string, unknown>;
    versionNumber: number;
    priority?: string | null;
  }) => void;
}

export function useSubmissionEditForm({ submission, onSave }: UseSubmissionEditFormArgs) {
  const current = submission.current_version;

  const [formName, setFormName] = useState(current.form_name);
  const [formNameError, setFormNameError] = useState(false);
  const [priority, setPriority] = useState<string | null>(
    submission.priority ?? null,
  );

  // versionNumber is pinned to the version this form was opened against.
  // We rely on the parent remounting this component (via `key`) whenever
  // the underlying current_version changes, rather than tracking it live,
  // so a stale value here always reflects the version the user is actually
  // editing against and lets the server's 409 check do its job correctly.
  const versionNumber = current.version_number;

  const handleFormNameChange = (value: string) => {
    setFormName(value);
    if (formNameError) setFormNameError(false);
  };

  const handleSubmit = ({ formData: nextData }: IChangeEvent) => {
    if (!formName.trim()) {
      setFormNameError(true);
      toast.error('Please enter a form name');
      return;
    }
    if (nextData !== undefined) {
      const data = nextData as Record<string, unknown>;
      // Priority is rendered inside the RJSF form (via the template's schema)
      // but must never be sent as part of `content` — pull it out and send it
      // as the submission's top-level `priority` attribute instead, same as
      // the fill page does.
      const priorityFieldKey = getPriorityFieldKey(submission.template.json_schema);
      const fieldPriorityValue = priorityFieldKey ? data[priorityFieldKey] : undefined;
      const resolvedPriority =
        typeof fieldPriorityValue === 'string' && fieldPriorityValue !== ''
          ? fieldPriorityValue
          : priority;

      const content = { ...data };

      // Only strip the priority field from `content` when the template's
      // JSON schema does not require it. If the priority field is required
      // by the schema, keep it present so server-side validation doesn't
      // reject the submission for missing properties.
      const schema = submission.template.json_schema as Record<string, unknown> | undefined;
      const required = Array.isArray(schema?.required)
        ? (schema?.required as unknown[]).filter((r): r is string => typeof r === 'string')
        : [];

      if (priorityFieldKey) {
        const isRequired = required.includes(priorityFieldKey);
        if (!isRequired && priorityFieldKey in content) {
          delete content[priorityFieldKey];
        }
      }

      onSave({
        formName: formName.trim(),
        content,
        versionNumber,
        priority: resolvedPriority,
      });
    }
  };

  return {
    formName,
    formNameError,
    handleFormNameChange,
    handleSubmit,
    priority,
    setPriority,
  };
}
