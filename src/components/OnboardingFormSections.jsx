import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";

const emptyValue = "__empty__";

export default function OnboardingFormSections({
  sections,
  formData,
  onChange,
  businessUnits = [],
  projects = [],
}) {
  const setValue = (key, value) => onChange({ ...formData, [key]: value });

  const renderField = (field) => {
    const value = formData[field.key];
    const id = `field-${field.key}`;

    if (field.type === "switch") {
      return (
        <div className={cn("flex min-h-10 items-center justify-between rounded-md border px-3 py-2", field.className)}>
          <Label htmlFor={id} className="text-sm font-medium">
            {field.label}
          </Label>
          <Switch id={id} checked={Boolean(value)} onCheckedChange={(checked) => setValue(field.key, checked)} />
        </div>
      );
    }

    if (field.options) {
      return (
        <FieldShell field={field} id={id}>
          <Select
            value={value || emptyValue}
            onValueChange={(nextValue) => setValue(field.key, nextValue === emptyValue ? "" : nextValue)}
            disabled={field.readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {!field.required && <SelectItem value={emptyValue}>Not set</SelectItem>}
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      );
    }

    if (field.type === "businessUnitSelect") {
      return (
        <FieldShell field={field} id={id}>
          <Select
            value={value || emptyValue}
            onValueChange={(nextValue) => setValue(field.key, nextValue === emptyValue ? "" : nextValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Business Unit" />
            </SelectTrigger>
            <SelectContent>
              {!field.required && <SelectItem value={emptyValue}>Unassigned</SelectItem>}
              {businessUnits.map((businessUnit) => (
                <SelectItem key={businessUnit.id} value={businessUnit.id}>
                  {businessUnit.name} {businessUnit.code ? `(${businessUnit.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      );
    }

    if (field.type === "projectSelect") {
      return (
        <FieldShell field={field} id={id}>
          <Select
            value={value || emptyValue}
            onValueChange={(nextValue) => setValue(field.key, nextValue === emptyValue ? "" : nextValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {!field.required && <SelectItem value={emptyValue}>Not set</SelectItem>}
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} {project.code ? `(${project.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
      );
    }

    if (field.type === "textarea" || field.type === "list") {
      return (
        <FieldShell field={field} id={id}>
          <Textarea
            id={id}
            value={value || ""}
            disabled={field.readOnly}
            required={field.required}
            placeholder={field.type === "list" ? "Comma or newline separated" : ""}
            onChange={(event) => setValue(field.key, event.target.value)}
          />
        </FieldShell>
      );
    }

    return (
      <FieldShell field={field} id={id}>
        <Input
          id={id}
          type={field.type || "text"}
          value={value || ""}
          readOnly={field.readOnly}
          required={field.required}
          onChange={(event) => setValue(field.key, event.target.value)}
        />
      </FieldShell>
    );
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className={cn(field.className)}>
                {renderField(field)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FieldShell({ field, id, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
