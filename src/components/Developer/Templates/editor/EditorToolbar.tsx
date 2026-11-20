"use client";
import type { Editor } from "@tiptap/react";
import SmallBtn from "@/components/Global/smallBtn";
import Dropdown from "@/components/Global/Dropdown";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import type { TemplateValues } from "@/lib/template-design";
import { STUDIO_FONTS, STUDIO_FONT_SIZES } from "./schema";
import type { InsertDialogMode } from "./InsertDialog";

type Props = {
  editor: Editor;
  values: TemplateValues;
  onValuesChange: (values: TemplateValues) => void;
  onOpenDialog: (mode: Exclude<InsertDialogMode, null>) => void;
};

export function EditorToolbar({ editor, values, onValuesChange, onOpenDialog }: Props) {
  const textStyle = editor.getAttributes("textStyle");
  const isLink = editor.isActive("link");
  const currentAlign = ["left", "center", "right"].find((align) => editor.isActive({ textAlign: align })) ?? "left";
  const currentBlock = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "0";
  const update = (part: Partial<TemplateValues>) => onValuesChange({ ...values, ...part });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl bg-white/80 px-3 py-3 shadow-sm bg-surface-raised/80">
      {/* Primary controls share a row even inside the phone frame. Secondary actions wrap naturally. */}
      <div className="studio-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="me-1 hidden shrink-0 text-xs font-medium text-zinc-500 sm:inline">Format</span>
        <Dropdown
          className="studio-control"
          label="Text style"
          selectedLabel={currentBlock === "0" ? "P" : `H${currentBlock}`}
          value={currentBlock}
          options={[
            { label: "Paragraph", value: "0" },
            { label: "Heading 1", value: "1" },
            { label: "Heading 2", value: "2" },
            { label: "Heading 3", value: "3" },
          ]}
          onChange={(value) => {
            if (value === "0") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
          }}
        />
        <Dropdown
          className="studio-control"
          label="Font"
          value={textStyle.fontFamily || values.fontFamily || STUDIO_FONTS[0].value}
          options={STUDIO_FONTS.map((font) => ({ label: font.label, value: font.value }))}
          onChange={(fontFamily) => {
            editor.chain().focus().setFontFamily(fontFamily).run();
            update({ fontFamily });
          }}
        />
        <Dropdown
          className="studio-control"
          label="Font size"
          value={textStyle.fontSize || values.fontSize || "15px"}
          options={STUDIO_FONT_SIZES.map((size) => ({ label: size, value: size }))}
          onChange={(fontSize) => {
            editor.chain().focus().setMark("textStyle", { fontSize }).run();
            update({ fontSize: fontSize as TemplateValues["fontSize"] });
          }}
        />
        <div className="w-9 shrink-0 overflow-hidden rounded-md" title="Text color">
          <InputField
            type="color"
            name="textColor"
            id="text-color"
            value={textStyle.color || "#52525b"}
            placeholder="Text color"
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <SmallBtn variant={editor.isActive("bold") ? "primary" : "ghost"} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></SmallBtn>
        <SmallBtn variant={editor.isActive("italic") ? "primary" : "ghost"} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></SmallBtn>
        <SmallBtn variant={editor.isActive("underline") ? "primary" : "ghost"} onClick={() => editor.chain().focus().toggleUnderline().run()}><span className="underline">U</span></SmallBtn>
        <SmallBtn variant={editor.isActive("strike") ? "primary" : "ghost"} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></SmallBtn>
        <Dropdown
          label="Alignment"
          selectedLabel={currentAlign.slice(0, 1).toUpperCase()}
          icon="ArrowRightLeft"
          value={currentAlign}
          options={["left", "center", "right"].map((align) => ({ label: align, value: align }))}
          onChange={(align) => editor.chain().focus().setTextAlign(align).run()}
        />
        <Dropdown
          label="Lists and blocks"
          selectedLabel="Blocks"
          icon="List"
          value="lists"
          options={[
            { label: "Bullet list", value: "bullet" },
            { label: "Ordered list", value: "ordered" },
            { label: "Quote", value: "quote" },
          ]}
          onChange={(value) => {
            if (value === "bullet") editor.chain().focus().toggleBulletList().run();
            if (value === "ordered") editor.chain().focus().toggleOrderedList().run();
            if (value === "quote") editor.chain().focus().toggleBlockquote().run();
          }}
        />
        <SmallBtn variant="ghost" onClick={() => editor.chain().focus().undo().run()}>Undo</SmallBtn>
        <SmallBtn variant="ghost" onClick={() => editor.chain().focus().redo().run()}>Redo</SmallBtn>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="me-1 text-xs font-medium text-zinc-500">Brand</span>
        <div className="w-9 shrink-0 overflow-hidden rounded-md" title="Brand color">
          <InputField
            type="color"
            name="brandColor"
            id="brand-color"
            value={values.brandColor ?? "#18181b"}
            placeholder="Brand color"
            onChange={(event) => update({ brandColor: event.target.value })}
          />
        </div>
        <SmallBtn variant={isLink ? "primary" : "ghost"} onClick={() => onOpenDialog("link")}>
          <Icon name="Link" size={14} strokeWidth={2} /> Link / CTA
        </SmallBtn>
        <SmallBtn variant="ghost" onClick={() => onOpenDialog("image")}>
          <Icon name="Image" size={14} strokeWidth={2} /> Image
        </SmallBtn>
      </div>
    </div>
  );
}
