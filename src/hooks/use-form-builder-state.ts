import { useLiveQuery } from "@tanstack/react-db";
import {
  type FormBuilder,
  type FormBuilderSettings,
  formBuilderCollection,
} from "@/db-collections/form-builder.collections";
import type { FormElements } from "@/types/form-types";
import {
  DEFAULT_FORM_ELEMENTS,
  DEFAULT_FORM_SETTINGS,
} from "@/services/form-builder.service";

const defaultFormBuilderState: Omit<FormBuilder, "id"> = {
  formName: "draft",
  schemaName: "draftFormSchema",
  formElements: DEFAULT_FORM_ELEMENTS,
  settings: DEFAULT_FORM_SETTINGS,
};

export type FormBuilderState = {
  formName: string;
  schemaName: string;
  formElements: FormElements;
  settings: FormBuilderSettings;
  generatedCommandUrl?: string;
};

export default function useFormBuilderState(): FormBuilderState {
  const { data } = useLiveQuery((q) =>
    q
      .from({ formBuilder: formBuilderCollection })
      .select(({ formBuilder }) => ({
        formName: formBuilder.formName,
        schemaName: formBuilder.schemaName,
        formElements: formBuilder.formElements,
        settings: formBuilder.settings,
        generatedCommandUrl: formBuilder.generatedCommandUrl,
      })),
  );

  return (data?.[0] ?? defaultFormBuilderState) as unknown as FormBuilderState;
}
