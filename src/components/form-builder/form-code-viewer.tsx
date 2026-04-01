import { useEffect, useMemo } from "react";
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "@/components/ui/code-block";
import CopyButton from "@/components/ui/copy-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FormElementOrList } from "@/db-collections/form-builder.collections";
import useFormBuilderState from "@/hooks/use-form-builder-state";
import {
  generateFormJsonSchema,
  generateFormUiSchema,
} from "@/lib/schema-generators";
import { logger } from "@/lib/utils";

export const Wrapper = ({
  children,
  language,
  title,
}: {
  language: string;
  children: string;
  title: string;
}) => {
  return (
    <CodeBlock className="my-0 w-full border-border border rounded-md overflow-hidden bg-background dark:bg-background/95">
      <CodeBlockGroup className="border-border border-b px-4 py-2 bg-muted/50 dark:bg-muted/20">
        <div className="bg-muted dark:bg-muted/80 py-1 px-1.5 rounded-sm text-muted-foreground dark:text-muted-foreground/90 text-sm font-medium">
          {title}
        </div>
        <CopyButton text={children} />
      </CodeBlockGroup>
      <div className="*:mt-0 [&_pre]:p-3 w-full bg-background dark:bg-background/95">
        <CodeBlockCode code={children} language={language} copyButton={false} />
      </div>
    </CodeBlock>
  );
};

const CodeBlockJsonSchema = () => {
  const { formElements } = useFormBuilderState();

  useEffect(() => {
    logger("Form elements changed, regenerating JSON Schema:", formElements);
  }, [formElements]);

  const schemaJson = useMemo(
    () =>
      JSON.stringify(
        generateFormJsonSchema(formElements as FormElementOrList[]),
        null,
        2,
      ),
    [formElements],
  );

  const uiSchemaJson = useMemo(
    () =>
      JSON.stringify(
        generateFormUiSchema(formElements as FormElementOrList[]),
        null,
        2,
      ),
    [formElements],
  );

  return (
    <div className="relative max-w-full flex flex-col gap-y-5">
      <Wrapper title="form.schema.json (react-jsonschema-form)" language="json">
        {schemaJson}
      </Wrapper>
      <Wrapper title="form.uiSchema.json (@rjsf)" language="json">
        {uiSchemaJson}
      </Wrapper>
    </div>
  );
};

export function GeneratedFormCodeViewer() {
  return (
    <ScrollArea className="h-[60vh]">
      <CodeBlockJsonSchema />
    </ScrollArea>
  );
}
