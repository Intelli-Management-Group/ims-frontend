import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formTemplatesApi } from "@/api/form-templates";
import { FormEdit } from "@/components/form-builder/form-edit";
import { FieldTab } from "@/components/form-builder/form-field-library";
import { SingleStepFormPreview } from "@/components/form-builder/form-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FormElementOrList } from "@/db-collections/form-builder.collections";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScreenSize } from "@/hooks/use-screen-size";
import useFormBuilderState from "@/hooks/use-form-builder-state";
import {
	generateFormJsonSchema,
	generateFormUiSchema,
	reverseMapRjsfToFormElements,
} from "@/lib/schema-generators";
import {
	initializeFormBuilder,
	loadFormTemplate,
	setFormName,
} from "@/services/form-builder.service";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";

export const Route = createFileRoute("/_authenticated/form-builder/$templateId")({
	component: EditFormBuilderPage,
});

type FormBuilderSidebarHeaderProps = {
	templateName: string;
	onTemplateNameChange: (value: string) => void;
	isSaving: boolean;
	onSave: () => void;
};

function FormBuilderSidebarHeader({
	templateName,
	onTemplateNameChange,
	isSaving,
	onSave,
}: FormBuilderSidebarHeaderProps) {
	return (
		<div className="flex items-center justify-between gap-2 p-4 border-b border-border">
			<div className="min-w-0 flex flex-col gap-2">
				<h3 className="text-lg font-semibold text-primary">Form Builder</h3>
				<div className="flex flex-col gap-1">
					<Input
						aria-label="Template name"
						className="h-8 text-sm font-semibold text-foreground"
						value={templateName}
						placeholder="Form Template Name"
						onChange={(e) => onTemplateNameChange(e.target.value)}
					/>
				</div>
			</div>
			<Button size="sm" onClick={onSave} disabled={isSaving} className="shrink-0">
				<Save className="mr-2 h-4 w-4" />
				{isSaving ? "Saving..." : "Save"}
			</Button>
		</div>
	);
}

function EditFormBuilderPage() {
	const { templateId } = Route.useParams();
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const screenSize = useScreenSize();
	const isTablet = screenSize.lessThan("lg") && !isMobile;
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [templateDbId, setTemplateDbId] = useState<number | null>(null);
	const { formElements } = useFormBuilderState();
	const [templateName, setTemplateName] = useState("");
	const { setBreadcrumbs } = useBreadcrumb();

	useEffect(() => {
		initializeFormBuilder();

		const numericId = Number(templateId);
		if (!numericId) {
			toast.error("Invalid template ID");
			navigate({ to: "/form-templates" });
			return;
		}

		formTemplatesApi
			.getFormTemplate(numericId)
			.then((template) => {
				const elements = reverseMapRjsfToFormElements(
					template.json_schema,
					template.ui_schema,
				);
				loadFormTemplate(template.name, elements as FormElementOrList[]);
				setTemplateName(template.name);
				setTemplateDbId(template.id);
				setBreadcrumbs([
					{ label: "Form Templates", path: "/form-templates" },
					{ label: template.name, path: `/form-builder/${template.id}` },
				]);
			})
			.catch(() => {
				toast.error("Failed to load template");
				navigate({ to: "/form-templates" });
			})
			.finally(() => {
				setIsLoading(false);
			});

		return () => setBreadcrumbs(null);
	}, [templateId, navigate, setBreadcrumbs]);

	const handleTemplateNameChange = (value: string) => {
		setTemplateName(value);
		setFormName(value);
		setBreadcrumbs([
			{ label: "Form Templates", path: "/form-templates" },
			{ label: value || "Untitled", path: `/form-builder/${templateId}` },
		]);
	};

	const jsonSchema = useMemo(
		() => generateFormJsonSchema(formElements as unknown as FormElementOrList[]),
		[formElements],
	);
	const uiSchema = useMemo(
		() => generateFormUiSchema(formElements as unknown as FormElementOrList[]),
		[formElements],
	);

	const handleSave = async () => {
		if (isSaving || templateDbId === null) return;
		const trimmedName = templateName.trim();
		if (!trimmedName) {
			toast.error("Enter a template name");
			return;
		}
		setIsSaving(true);
		try {
			await formTemplatesApi.updateFormTemplate(templateDbId, {
				name: trimmedName,
				json_schema: jsonSchema as Record<string, unknown>,
				ui_schema: uiSchema as Record<string, unknown>,
			});
			toast.success("Template updated");
		} catch (_error) {
			toast.error("Failed to update template");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<main className="h-[calc(100dvh-4rem)] w-full flex items-center justify-center">
				<p className="text-muted-foreground">Loading template…</p>
			</main>
		);
	}

	if (isMobile) {
		return (
			<main className="h-[calc(100dvh-4rem)] w-full flex flex-col min-h-0">
				<div className="flex flex-col flex-1 min-h-0">
					<div className="border-b border-border shrink-0">
						<FormBuilderSidebarHeader
							templateName={templateName}
							onTemplateNameChange={handleTemplateNameChange}
							isSaving={isSaving}
							onSave={handleSave}
						/>
						<div className="shrink-0">
							<FieldTab />
						</div>
					</div>

					<div className="p-4 border-b border-border shrink-0">
						<div className="mb-4 pb-2 border-b">
							<h3 className="text-lg font-semibold text-primary">Editor</h3>
							<p className="text-sm text-muted-foreground">
								Design your form elements
							</p>
						</div>
						<FormEdit />
					</div>

					<div className="p-4 shrink-0">
						<div className="mb-4 pb-2 border-b">
							<h3 className="text-lg font-semibold text-primary">Preview</h3>
							<p className="text-sm text-muted-foreground">
								See how your form looks
							</p>
						</div>
						<SingleStepFormPreview />
					</div>
				</div>
			</main>
		);
	}

	if (isTablet) {
		return (
			<main className="h-[calc(100dvh-4rem)] w-full flex flex-col min-h-0 min-w-0">
				<ResizablePanelGroup
					direction="vertical"
					className="flex-1 min-h-0 min-w-0"
				>
					<ResizablePanel defaultSize={40} minSize={30} className="min-h-0 min-w-0">
						<div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
							<FormBuilderSidebarHeader
								templateName={templateName}
								onTemplateNameChange={handleTemplateNameChange}
								isSaving={isSaving}
								onSave={handleSave}
							/>
							<div className="flex-1 min-h-0 min-w-0">
								<FieldTab />
							</div>
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle className="z-20 shrink-0" />

					<ResizablePanel defaultSize={60} minSize={30} className="min-h-0 min-w-0">
						<ResizablePanelGroup
							direction="horizontal"
							className="h-full min-h-0 min-w-0"
						>
							<ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
								<div className="flex flex-col h-full border-r min-h-0">
									<div className="p-4 border-b shrink-0">
										<h3 className="text-lg font-semibold text-primary">Editor</h3>
										<p className="text-sm text-muted-foreground">
											Design your form elements
										</p>
									</div>
									<ScrollArea className="flex-1 min-h-0">
										<div className="p-4">
											<FormEdit />
										</div>
									</ScrollArea>
								</div>
							</ResizablePanel>

							<ResizableHandle withHandle className="z-20 shrink-0" />

							<ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
								<div className="flex flex-col h-full min-h-0">
									<div className="p-4 border-b shrink-0">
										<h3 className="text-lg font-semibold text-primary">Preview</h3>
										<p className="text-sm text-muted-foreground">
											See how your form looks
										</p>
									</div>
									<ScrollArea className="flex-1 min-h-0">
										<div className="p-4">
											<SingleStepFormPreview />
										</div>
									</ScrollArea>
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>
				</ResizablePanelGroup>
			</main>
		);
	}

	return (
		<main className="h-[calc(100dvh-4rem)] w-full min-h-0 min-w-0">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full min-h-0 min-w-0"
			>
				<ResizablePanel
					defaultSize={28}
					minSize={18}
					className="min-w-0 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-r"
				>
					<div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
						<FormBuilderSidebarHeader
							templateName={templateName}
							onTemplateNameChange={handleTemplateNameChange}
							isSaving={isSaving}
							onSave={handleSave}
						/>
						<div className="flex-1 min-h-0 min-w-0">
							<FieldTab />
						</div>
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle className="z-20 shrink-0" />

				<ResizablePanel defaultSize={72} minSize={30} className="min-w-0">
					<ResizablePanelGroup
						direction="horizontal"
						className="h-full min-h-0 min-w-0"
					>
						<ResizablePanel defaultSize={50} minSize={25} className="min-w-0">
							<div className="flex flex-col h-full border-r min-h-0">
								<div className="p-4 border-b shrink-0">
									<h3 className="text-lg font-semibold text-primary">Editor</h3>
									<p className="text-sm text-muted-foreground">
										Design your form elements
									</p>
								</div>
								<ScrollArea className="flex-1 min-h-0">
									<div className="p-4">
										<FormEdit />
									</div>
								</ScrollArea>
							</div>
						</ResizablePanel>

						<ResizableHandle withHandle className="z-20 shrink-0" />

						<ResizablePanel defaultSize={50} minSize={25} className="min-w-0">
							<div className="flex flex-col h-full min-h-0">
								<div className="p-4 border-b shrink-0">
									<h3 className="text-lg font-semibold text-primary">Preview</h3>
									<p className="text-sm text-muted-foreground">
										See how your form looks
									</p>
								</div>
								<ScrollArea className="flex-1 min-h-0">
									<div className="p-4">
										<SingleStepFormPreview />
									</div>
								</ScrollArea>
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>
		</main>
	);
}
