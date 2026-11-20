import { InputField } from "@/components/Global/InputField";
import { TextAreaField } from "@/components/Global/TextAreaField";
import Dropdown from "@/components/Global/Dropdown";

type Props = {
  name: string;
  subject: string;
  isDefault: boolean;
  onNameChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDefaultChange: (value: boolean) => void;
  sourceHtml?: string;
  onSourceHtmlChange?: (value: string) => void;
};

export function TemplateDetails({
  name,
  subject,
  isDefault,
  onNameChange,
  onSubjectChange,
  onDefaultChange,
  sourceHtml,
  onSourceHtmlChange,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 pb-1">
      <div className="grid grid-cols-1 gap-1">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Template details</h3>
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Reusable name and subject used when this template is linked to a form.
        </p>
      </div>
      <InputField
        type="text"
        name="templateName"
        id="template-name"
        label="Name"
        placeholder="Customer welcome"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <InputField
        type="text"
        name="templateSubject"
        id="template-subject"
        label="Subject"
        placeholder="New submission on {{form.title}}"
        value={subject}
        onChange={(event) => onSubjectChange(event.target.value)}
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Variables: <code>{"{{form.title}}"}</code>, <code>{"{{site.name}}"}</code>, and form field names.
      </p>
      <Dropdown
        label="Workspace default"
        value={isDefault ? "yes" : "no"}
        options={[
          { label: "Regular template", value: "no" },
          { label: "Use as workspace default", value: "yes" },
        ]}
        onChange={(value) => onDefaultChange(value === "yes")}
      />
      {onSourceHtmlChange && (
        <div className="font-mono text-xs">
          <TextAreaField
            name="sourceHtml"
            id="source-html"
            label="Raw HTML"
            placeholder="<!doctype html>"
            value={sourceHtml ?? ""}
            rows={16}
            onChange={(event) => onSourceHtmlChange(event.target.value)}
          />
        </div>
      )}
    </section>
  );
}
