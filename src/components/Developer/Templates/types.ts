import type { TemplateDesign, TemplateValues } from "@/lib/template-design";

export type PresetDefinition = {
  id: string;
  name: string;
  description: string;
  subject: string;
  defaults: TemplateValues;
};

export type TemplateRecord = {
  id: string;
  name: string;
  subjectTemplate: string;
  htmlTemplate: string;
  isDefault: boolean;
  design: TemplateDesign | null;
  createdAt: string;
  updatedAt: string;
};
