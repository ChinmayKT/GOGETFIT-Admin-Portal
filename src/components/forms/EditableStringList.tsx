import { Plus, X, GripVertical } from "lucide-react";
import { Field } from "./Field";
import { Textarea } from "./Textarea";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

interface EditableStringListProps {
  label: string;
  helperText?: string;
  value: string[];
  onChange: (value: string[]) => void;
  addLabel?: string;
}

export function EditableStringList({ label, helperText, value, onChange, addLabel = "Add item" }: EditableStringListProps) {
  function updateItem(i: number, text: string) {
    onChange(value.map((v, idx) => (idx === i ? text : v)));
  }
  function removeItem(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function addItem() {
    onChange([...value, ""]);
  }

  return (
    <Field label={label} helperText={helperText}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {value.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: "var(--text-disabled)", paddingTop: 10 }}>
              <GripVertical size={14} />
            </span>
            <Textarea rows={2} value={item} onChange={(e) => updateItem(i, e.target.value)} style={{ flex: 1 }} />
            <IconButton icon={<X size={14} />} label="Remove item" size="sm" onClick={() => removeItem(i)} />
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addItem} style={{ alignSelf: "flex-start" }}>
          {addLabel}
        </Button>
      </div>
    </Field>
  );
}
