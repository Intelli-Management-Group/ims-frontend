import { useNavigate } from "@tanstack/react-router";
import type { IChangeEvent } from "@rjsf/core";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formTemplatesApi } from "@/api/form-templates";
import { formSubmissionsApi } from "@/api/form-submissions";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import axios from "axios";
import { PRIORITY_VALUES } from "@/constants/priority-options";

function getPriorityFieldKey(schema: Record<string, unknown>): string | undefined {
	const properties = schema?.properties;
	if (!properties || typeof properties !== "object") return undefined;

	for (const [key, value] of Object.entries(properties as Record<string, unknown>)) {
		if (!value || typeof value !== "object") continue;

		const enumValues = (value as Record<string, unknown>).enum;
		if (!Array.isArray(enumValues)) continue;

		const stringValues = enumValues.filter(
			(item): item is string => typeof item === "string",
		);
		if (stringValues.length !== PRIORITY_VALUES.length) continue;

		const isPriorityEnum = PRIORITY_VALUES.every((priority) =>
			stringValues.includes(priority),
		);
		if (isPriorityEnum) return key;
	}

	return undefined;
}

export function useFormFillPage(templateId: string) {
	const navigate = useNavigate();
	const { setBreadcrumbs } = useBreadcrumb();

	const numericId = Number(templateId);
	const isValidId = templateId !== "" && Number.isFinite(numericId);

	const [formName, setFormName] = useState("");
	const [formNameError, setFormNameError] = useState(false);
	const [priority, setPriority] = useState<string | null>(null);

	const {
		data: template,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["form-template", numericId],
		queryFn: () => formTemplatesApi.getFormTemplate(numericId),
		enabled: isValidId,
		retry: false,
	});

	useEffect(() => {
		if (!isValidId) {
			toast.error("Invalid template ID");
			navigate({ to: "/forms" });
		}
	}, [isValidId, navigate]);

	useEffect(() => {
		if (isError) {
			toast.error("Failed to load form template");
			navigate({ to: "/forms" });
		}
	}, [isError, navigate]);

	useEffect(() => {
		if (template) {
			setBreadcrumbs([
				{ label: "Forms", path: "/forms" },
				{ label: template.name, path: `/forms/${template.id}` },
			]);
		}
		return () => setBreadcrumbs(null);
	}, [template, setBreadcrumbs]);

	const { mutate: submitForm, isPending: isSubmitting } = useMutation({
		mutationFn: ({
			content,
			priority,
		}: {
			content: Record<string, unknown>;
			priority?: string;
		}) => {
			if (!template?.current_version) {
				throw new Error("Template version not found");
			}

			return formSubmissionsApi.createFormSubmission({
				form_template_id: numericId,
				form_template_version_id: template.current_version.id,
				form_name: formName.trim(),
				content,
				...(priority !== undefined ? { priority } : {}),
			});
		},

		onSuccess: () => {
			toast.success("Form submitted successfully");
			navigate({ to: "/forms" });
		},

		onError: (error) => {
			console.error(error);

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

				toast.error(response?.message ?? "Failed to submit form");
				return;
			}

			toast.error("Failed to submit form");
		},
	});

	const handleSubmit = ({ formData }: IChangeEvent) => {
		if (!formName.trim()) {
			setFormNameError(true);
			toast.error("Please enter a form name");
			return;
		}

		if (formData) {
			const nextData = formData as Record<string, unknown>;
			const priorityFieldKey = template
				? getPriorityFieldKey(template.json_schema as Record<string, unknown>)
				: undefined;
			const explicitPriority = priority ?? undefined;
			const formFieldPriorityValue = priorityFieldKey
				? nextData[priorityFieldKey]
				: nextData["priority"];
			const resolvedPriority =
				typeof explicitPriority === "string" && explicitPriority !== ""
					? explicitPriority
					: typeof formFieldPriorityValue === "string" && formFieldPriorityValue !== ""
					? formFieldPriorityValue
					: undefined;

			const contentWithoutPriority = { ...nextData };
			if (priorityFieldKey && priorityFieldKey in contentWithoutPriority) {
				delete contentWithoutPriority[priorityFieldKey];
			} else if ("priority" in contentWithoutPriority) {
				delete contentWithoutPriority["priority"];
			}

			submitForm({ content: contentWithoutPriority, priority: resolvedPriority });
		}
	};

	const handleFormNameChange = (value: string) => {
		setFormName(value);
		if (formNameError) setFormNameError(false);
	};

	const goBack = () => navigate({ to: "/forms" });

	return {
		template,
		isLoading,
		formName,
		formNameError,
		isSubmitting,
		handleSubmit,
		handleFormNameChange,
		goBack,
		priority,
		setPriority,
	};
}
