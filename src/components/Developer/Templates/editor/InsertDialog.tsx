"use client";
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import { useToast } from "@/components/Global/Toast";
import Layout from "@/components/Developer/Modals/Layout";

export type InsertDialogMode = "link" | "image" | null;

type Props = {
  editor: Editor;
  mode: Exclude<InsertDialogMode, null>;
  onClose: () => void;
};

/** Focused URL dialog; the main editor stays free of persistent insertion forms. */
export function InsertDialog({ editor, mode, onClose }: Props) {
  const [url, setUrl] = useState(mode === "link" ? editor.getAttributes("link").href ?? "" : "");
  const [alt, setAlt] = useState("");
  const toast = useToast();

  useEffect(() => {
    // Put the cursor in the URL field without obscuring the editor with extra panels.
    const field = document.getElementById(mode === "link" ? "inline-link-url" : "inline-image-url");
    if (field instanceof HTMLInputElement) field.focus();
  }, [mode]);

  const applyLink = (isCta: boolean) => {
    const href = url.trim();
    if (!/^(https?:\/\/|\/)/i.test(href)) {
      toast.error("Enter a valid URL beginning with https://, http://, or /.");
      return;
    }
    if (!editor.isActive("link") && editor.state.selection.empty) {
      toast.error("Select the text you want to link, then apply the URL.");
      return;
    }

    editor.chain().focus().setLink({ href }).updateAttributes("link", { "data-cta": isCta ? "true" : null }).run();
    onClose();
  };

  const insertImage = () => {
    const src = url.trim();
    if (!/^(https?:\/\/|\/)/i.test(src)) {
      toast.error("Enter a valid image URL beginning with https://, http://, or /.");
      return;
    }
    editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
    onClose();
  };

  return (
    <Layout onClick={onClose} label={mode === "link" ? "Add link" : "Insert image"}>
      <section className="w-full max-w-md rounded-card bg-white p-card shadow-2xl sm:p-6 dark:bg-zinc-950"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (mode === "link") applyLink(false);
            else insertImage();
          }
        }}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {mode === "link" ? "Add a link" : "Insert an image"}
        </h2>
        <p className="mt-1 pb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "link"
            ? "Apply a link to the selected text, or turn it into a CTA button."
            : "Use an existing hosted image URL. It will fit this frame automatically, without uploads."}
        </p>
        <InputField
          type="url"
          name={mode === "link" ? "inlineLinkUrl" : "inlineImageUrl"}
          id={mode === "link" ? "inline-link-url" : "inline-image-url"}
          label={mode === "link" ? "Website URL" : "Image URL"}
          placeholder={mode === "link" ? "https://your-website.com/â€¦" : "https://â€¦/image.png"}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        {mode === "image" && (
          <div className="mt-3">
            <InputField
              type="text"
              name="imageAltText"
              id="image-alt-text"
              label="Alternative text (optional)"
              placeholder="Describe the image"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
            />
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {mode === "link" ? (
            <>
              <FormButton variant="primary" onClick={() => applyLink(false)}>Apply link</FormButton>
              <FormButton variant="secondary" onClick={() => applyLink(true)}>Make CTA button</FormButton>
              <FormButton
                variant="danger"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  onClose();
                }}
              >
                Remove link
              </FormButton>
            </>
          ) : (
            <FormButton variant="primary" onClick={insertImage}>Insert image</FormButton>
          )}
        </div>
      </section>
    </Layout>
  );
}

