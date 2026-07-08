import { useNavigate } from "@tanstack/react-router";
import type { IChangeEvent } from "@rjsf/core";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formTemplatesApi } from "@/api/form-templates";
import { formSubmissionsApi } from "@/api/form-submissions";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

export function useFormFillPage(templateId: string) {
	const navigate = useNavigate();
	const { setBreadcrumbs } = useBreadcrumb();

	const numericId = Number(templateId);
	const isValidId = templateId !== "" && Number.isFinite(numericId);

	const [formName, setFormName] = useState("");
	const [formNameError, setFormNameError] = useState(false);

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
		mutationFn: (content: Record<string, unknown>) =>
			formSubmissionsApi.createFormSubmission({
				form_template_id: numericId,
				form_name: formName.trim(),
				content,
			}),
		onSuccess: () => {
			toast.success("Form submitted successfully");
			navigate({ to: "/forms" });
		},
		onError: () => {
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
			submitForm(formData as Record<string, unknown>);
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
	};
}
