"use client";
import { useState } from "react";
import SmallBtn from "@/components/Global/smallBtn";
import { Icon } from "@/components/Global/Icon";
import type { TemplateValues } from "@/lib/template-design";
import { DeviceFrame } from "./DeviceFrame";
import { RichTextEditor } from "./RichTextEditor";

export function StudioCanvas({
  values,
  onChange,
  siteName,
}: {
  values: TemplateValues;
  onChange: React.Dispatch<React.SetStateAction<TemplateValues>>;
  siteName: string;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Edit directly on the email. Formatting stays with your content.
        </div>
        <div className="flex shrink-0 gap-2">
          <SmallBtn variant={device === "desktop" ? "primary" : "secondary"} onClick={() => setDevice("desktop")}>
            <Icon name="Monitor" size={14} /> Desktop
          </SmallBtn>
          <SmallBtn variant={device === "mobile" ? "primary" : "secondary"} onClick={() => setDevice("mobile")}>
            <Icon name="Smartphone" size={14} /> Mobile
          </SmallBtn>
        </div>
      </div>
      <DeviceFrame device={device}>
        <RichTextEditor values={values} onChange={onChange} siteName={siteName} />
      </DeviceFrame>
    </div>
  );
}
