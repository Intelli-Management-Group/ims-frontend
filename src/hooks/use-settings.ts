import { useLiveQuery } from "@tanstack/react-db";
import {
  type FormBuilderSettings,
  formBuilderCollection,
} from "@/db-collections/form-builder.collections";

export type SettingsCollection = FormBuilderSettings & { id?: string };

const defaultSettings: FormBuilderSettings = {
  activeTab: "builder",
  defaultRequiredValidation: true,
  numericInput: false,
  focusOnError: true,
  validationMethod: "onDynamic",
  asyncValidation: 300,
  preferredSchema: "zod",
  preferredFramework: "react",
  preferredPackageManager: "pnpm",
  isCodeSidebarOpen: false,
};

export default function useSettings(): FormBuilderSettings {
  const { data } = useLiveQuery((q) =>
    q.from({ form: formBuilderCollection }).select(({ form }) => ({
      activeTab: form.settings.activeTab,
      defaultRequiredValidation: form.settings.defaultRequiredValidation,
      numericInput: form.settings.numericInput,
      focusOnError: form.settings.focusOnError,
      validationMethod: form.settings.validationMethod,
      asyncValidation: form.settings.asyncValidation,
      preferredSchema: form.settings.preferredSchema,
      preferredFramework: form.settings.preferredFramework,
      preferredPackageManager: form.settings.preferredPackageManager,
      isCodeSidebarOpen: form.settings.isCodeSidebarOpen,
    })),
  );
  return data?.[0] || defaultSettings;
}
