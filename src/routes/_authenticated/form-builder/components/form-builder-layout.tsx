import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormEdit } from '@/components/form-builder/form-edit';
import { FieldTab } from '@/components/form-builder/form-field-library';
import { SingleStepFormPreview } from '@/components/form-builder/form-preview';
import { useAuth } from '@/hooks/use-auth';
import { PermissionsPanel } from './permissions-panel';
import type { PermissionGrantRow } from './usePermissionsPanel';

// ─── Sidebar header ──────────────────────────────────────────────────────────

export interface FormBuilderSidebarHeaderProps {
  templateName: string;
  onTemplateNameChange: (value: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function FormBuilderSidebarHeader({
  templateName,
  onTemplateNameChange,
  isSaving,
  onSave,
}: FormBuilderSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
      <div className="min-w-0 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-primary">Form Builder</h3>
        <Input
          aria-label="Template name"
          className="h-8 text-sm font-semibold text-foreground"
          value={templateName}
          placeholder="Form Template Name"
          onChange={(e) => onTemplateNameChange(e.target.value)}
        />
      </div>
      <Button size="sm" onClick={onSave} disabled={isSaving} className="shrink-0">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

// ─── Reusable panel section ───────────────────────────────────────────────────

interface PanelSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

function PanelSection({ title, description, children, className = '' }: PanelSectionProps) {
  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div className="p-4 border-b shrink-0">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">{children}</div>
      </ScrollArea>
    </div>
  );
}

// ─── Build / Permissions tabs ─────────────────────────────────────────────────
// Wraps the Editor+Preview content in a "Build" tab alongside a "Permissions"
// tab (admin-only) for managing who can view/create/edit against this template.

interface BuildAreaProps {
  templateId: number | null;
  buildContent: React.ReactNode;
  className?: string;
  onPermissionDraftChange?: (grants: PermissionGrantRow[]) => void;
}

function BuildArea({ templateId, buildContent, className = '', onPermissionDraftChange }: BuildAreaProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className={`h-full min-h-0 min-w-0 ${className}`}>{buildContent}</div>;
  }

  return (
    <Tabs defaultValue="build" className={`h-full min-h-0 min-w-0 flex flex-col ${className}`}>
      <div className="border-b border-border px-4 py-2 shrink-0">
        <TabsList>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="build" className="flex-1 min-h-0 min-w-0 m-0">
        {buildContent}
      </TabsContent>
      <TabsContent value="permissions" className="flex-1 min-h-0 min-w-0 m-0 overflow-y-auto">
        <div className="p-4">
          <PermissionsPanel templateId={templateId} onDraftPermissionsChange={onPermissionDraftChange} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Layout variants ──────────────────────────────────────────────────────────

export interface FormBuilderLayoutProps {
  headerProps: FormBuilderSidebarHeaderProps;
  /** The database id of the template being edited; null for a new, unsaved template. */
  templateId?: number | null;
  onPermissionDraftChange?: (grants: PermissionGrantRow[]) => void;
}

export function FormBuilderMobileLayout({ headerProps, templateId = null, onPermissionDraftChange }: FormBuilderLayoutProps) {
  const buildContent = (
    <>
      <div className="p-4 border-b border-border shrink-0">
        <div className="mb-4 pb-2 border-b">
          <h3 className="text-lg font-semibold text-primary">Editor</h3>
          <p className="text-sm text-muted-foreground">Design your form elements</p>
        </div>
        <FormEdit />
      </div>

      <div className="p-4 shrink-0">
        <div className="mb-4 pb-2 border-b">
          <h3 className="text-lg font-semibold text-primary">Preview</h3>
          <p className="text-sm text-muted-foreground">See how your form looks</p>
        </div>
        <SingleStepFormPreview />
      </div>
    </>
  );

  return (
    <main className="h-[calc(100dvh-4rem)] w-full flex flex-col min-h-0">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border shrink-0">
          <FormBuilderSidebarHeader {...headerProps} />
          <div className="shrink-0">
            <FieldTab />
          </div>
        </div>

        <BuildArea templateId={templateId} buildContent={buildContent} className="flex-1" onPermissionDraftChange={onPermissionDraftChange} />
      </div>
    </main>
  );
}

export function FormBuilderTabletLayout({ headerProps, templateId = null, onPermissionDraftChange }: FormBuilderLayoutProps) {
  const buildContent = (
    <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 min-w-0">
      <ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
        <PanelSection title="Editor" description="Design your form elements" className="border-r">
          <FormEdit />
        </PanelSection>
      </ResizablePanel>

      <ResizableHandle withHandle className="z-20 shrink-0" />

      <ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
        <PanelSection title="Preview" description="See how your form looks">
          <SingleStepFormPreview />
        </PanelSection>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <main className="h-[calc(100dvh-4rem)] w-full flex flex-col min-h-0 min-w-0">
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0 min-w-0">
        <ResizablePanel defaultSize={40} minSize={30} className="min-h-0 min-w-0">
          <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <FormBuilderSidebarHeader {...headerProps} />
            <div className="flex-1 min-h-0 min-w-0">
              <FieldTab />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="z-20 shrink-0" />

        <ResizablePanel defaultSize={60} minSize={30} className="min-h-0 min-w-0">
          <BuildArea templateId={templateId} buildContent={buildContent} onPermissionDraftChange={onPermissionDraftChange} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}

export function FormBuilderDesktopLayout({ headerProps, templateId = null, onPermissionDraftChange }: FormBuilderLayoutProps) {
  const buildContent = (
    <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 min-w-0">
      <ResizablePanel defaultSize={50} minSize={25} className="min-w-0">
        <PanelSection title="Editor" description="Design your form elements" className="border-r">
          <FormEdit />
        </PanelSection>
      </ResizablePanel>

      <ResizableHandle withHandle className="z-20 shrink-0" />

      <ResizablePanel defaultSize={50} minSize={25} className="min-w-0">
        <PanelSection title="Preview" description="See how your form looks">
          <SingleStepFormPreview />
        </PanelSection>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <main className="h-[calc(100dvh-4rem)] w-full min-h-0 min-w-0">
      <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 min-w-0">
        <ResizablePanel
          defaultSize={28}
          minSize={18}
          className="min-w-0 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-r"
        >
          <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <FormBuilderSidebarHeader {...headerProps} />
            <div className="flex-1 min-h-0 min-w-0">
              <FieldTab />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="z-20 shrink-0" />

        <ResizablePanel defaultSize={72} minSize={30} className="min-w-0">
          <BuildArea templateId={templateId} buildContent={buildContent} onPermissionDraftChange={onPermissionDraftChange} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
