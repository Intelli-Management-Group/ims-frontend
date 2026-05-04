import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import type { IChangeEvent } from "@rjsf/core";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { formTemplatesApi } from "@/api/form-templates";
import { formSubmissionsApi } from "@/api/form-submissions";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/forms/$templateId")({
	component: FormFillPage,
});

function FormFillPage() {
	const { templateId } = Route.useParams();
	const navigate = useNavigate();
	const { setBreadcrumbs } = useBreadcrumb();

	const numericId = Number(templateId);

	const [formName, setFormName] = useState("");

	const {
		data: template,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["form-template", numericId],
		queryFn: () => formTemplatesApi.getFormTemplate(numericId),
		enabled: !!numericId,
		retry: false,
	});

	// useEffect(() => {
	// 	if (template && !formName) {
	// 		setFormName(template.name);
	// 	}
	// }, [template]);

	useEffect(() => {
		if (!numericId) {
			toast.error("Invalid template ID");
			navigate({ to: "/forms" });
		}
	}, [numericId, navigate]);

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
				form_name: formName,
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
		if (formData) {
			submitForm(formData as Record<string, unknown>);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-2xl space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
				<div className="space-y-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-10 w-full" />
						</div>
					))}
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
		);
	}

	if (!template) {
		return null;
	}

	return (
		<div className="max-w-2xl space-y-6">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate({ to: "/forms" })}
						className="-ml-2"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
				</div>
				<p className="text-muted-foreground text-sm">
					Fill out the form below and submit.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="formName" className="gap-0.5">
					Form Name <span className="text-destructive">*</span>
				</Label>
				<Input
					id="formName"
					value={formName}
					onChange={(e) => setFormName(e.target.value)}
					placeholder="Enter form name"
					disabled={isSubmitting}
					required
					form="template-form"
				/>
			</div>

			<div className="rjsf-container">
				<Form
					id="template-form"
					schema={template.json_schema as any}
					uiSchema={template.ui_schema as any}
					validator={validator}
					onSubmit={handleSubmit}
					disabled={isSubmitting}
					omitExtraData
					focusOnFirstError
				>
					<div className="pt-2">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Submitting..." : "Submit"}
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
}
