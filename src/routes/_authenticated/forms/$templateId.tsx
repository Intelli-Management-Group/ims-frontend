import { createFileRoute } from "@tanstack/react-router";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormFillPage } from "./useFormFillPage";

export const Route = createFileRoute("/_authenticated/forms/$templateId")({
	component: FormFillPage,
});

function FormFillPage() {
	const { templateId } = Route.useParams();
	const {
		template,
		isLoading,
		canFill,
		formName,
		formNameError,
		isSubmitting,
		handleSubmit,
		handleFormNameChange,
		goBack,
	} = useFormFillPage(templateId);

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

	if (!template || !canFill) {
		return null;
	}

	return (
		<div className="max-w-2xl space-y-6">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
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
					onChange={(e) => handleFormNameChange(e.target.value)}
					placeholder="Enter form name"
					disabled={isSubmitting}
					aria-invalid={formNameError}
					required
					form="template-form"
				/>
				{formNameError && (
					<p className="text-destructive text-sm">Form name is required.</p>
				)}
			</div>

			<div className="rjsf-container">
				<Form
					id="template-form"
					schema={template.json_schema as RJSFSchema}
					uiSchema={template.ui_schema as UiSchema}
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
