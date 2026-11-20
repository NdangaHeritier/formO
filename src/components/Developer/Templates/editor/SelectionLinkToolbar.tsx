"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { posToDOMRect, type Editor } from "@tiptap/core";
import SmallBtn from "@/components/Global/smallBtn";
import { Icon } from "@/components/Global/Icon";

type Props = {
  editor: Editor;
  onOpenLinkDialog: () => void;
};

/** Appears only for a real text selection; modal opening hides it immediately. */
export function SelectionLinkToolbar({ editor, onOpenLinkDialog }: Props) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) {
        setPosition(null);
        return;
      }
      const rect = posToDOMRect(editor.view, from, to);
      const isBelowViewportEdge = rect.top < 48;
      setPosition({
        top: isBelowViewportEdge ? rect.bottom + 8 : rect.top - 40,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 144)),
      });
    };
    const hide = () => setPosition(null);

    editor.on("selectionUpdate", updatePosition);
    editor.on("blur", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [editor]);

  if (!position) return null;
  return createPortal(
    <div
      className="fixed z-[70] rounded-md p-1 shadow-lg"
      style={position}
      onMouseDown={(event) => event.preventDefault()}
    >
      <SmallBtn variant="secondary" onClick={onOpenLinkDialog}>
        <Icon name="Link" size={13} /> Link / CTA
      </SmallBtn>
    </div>,
    document.body
  );
}

