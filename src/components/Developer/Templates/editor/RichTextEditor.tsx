"use client";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { TemplateValues } from "@/lib/template-design";
import { documentFromTemplateValues, getEditorExtensions } from "./schema";
import { EditorToolbar } from "./EditorToolbar";
import { InsertDialog, type InsertDialogMode } from "./InsertDialog";
import { SelectionLinkToolbar } from "./SelectionLinkToolbar";
import { Skeleton } from "@/components/Global/Skeleton";

type Props = {
  values: TemplateValues;
  onChange: React.Dispatch<React.SetStateAction<TemplateValues>>;
  siteName: string;
};

/** The actual WYSIWYG email surface, not an input representation of it. */
export function RichTextEditor({ values, onChange, siteName }: Props) {
  const [dialogMode, setDialogMode] = useState<InsertDialogMode>(null);
  const [extensions] = useState(getEditorExtensions);
  const [, setSelectionRevision] = useState(0);
  const [initialDocument] = useState<JSONContent>(
    () => (values.content as JSONContent | undefined) ?? documentFromTemplateValues(values)
  );

  const editor = useEditor({
    extensions,
    content: initialDocument,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Edit email content",
        class: "formo-editor-content outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange((currentValues) => ({ ...currentValues, content: current.getJSON() }));
    },
    onSelectionUpdate: () => {
      // Keep dropdown labels and active formatting in sync with the caret.
      setSelectionRevision((revision) => revision + 1);
    },
  });

  if (!editor) {
    return <Skeleton className="h-40 min-h-[360px] rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <EditorToolbar editor={editor} values={values} onValuesChange={onChange} onOpenDialog={setDialogMode} />
      {!dialogMode && <SelectionLinkToolbar editor={editor} onOpenLinkDialog={() => setDialogMode("link")} />}
      {dialogMode && <InsertDialog key={dialogMode} editor={editor} mode={dialogMode} onClose={() => setDialogMode(null)} />}

      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 bg-surface-raised dark:border-zinc-800">
        <section className="px-6 py-4 sm:px-8" style={{ backgroundColor: values.brandColor ?? "#18181b" }}>
          <span
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Edit sender name"
            onBlur={(event) => {
              const brandName = event.currentTarget.textContent?.trim();
              if (brandName) onChange({ ...values, brandName });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            className="inline-block rounded px-1 text-sm font-bold tracking-wide text-white outline-none focus:ring-2 focus:ring-white/50"
          >
            {values.brandName || siteName}
          </span>
        </section>
        <section
          className="formo-editor-canvas px-6 py-8 sm:px-10 sm:py-10"
          style={{
            fontFamily: values.fontFamily ?? "Arial, sans-serif",
            fontSize: values.fontSize ?? "15px",
            color: "#52525b",
            lineHeight: 1.6,
            "--formo-brand-color": values.brandColor ?? "#18181b",
          } as React.CSSProperties}
        >
          <EditorContent editor={editor} />
        </section>
        <footer className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-400 sm:px-8">
          Sent via {values.brandName || siteName} — click any text above to edit directly.
        </footer>
      </div>
    </div>
  );
}
