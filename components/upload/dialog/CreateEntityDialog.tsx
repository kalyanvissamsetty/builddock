"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

type FieldConfig = {
    name: string,
    placeHolder: string,
}
type Props = {
  title: string;
  triggerLabel?: string;
  fields: FieldConfig[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
  showAddButton: boolean;
};

export function CreateEntityDialog({
  title,
  fields,
  triggerLabel = "+",
  onSubmit,
  showAddButton
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  function updateValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }
  async function handleSubmit() {
    try {
      for (const field of fields) {
        if (!values[field.name]?.trim()) {
          setError(`${field.name} is required`);
          return;
        }
      }
      setLoading(true);
      setError(null);

      await onSubmit(values);

      // CLOSE ONLY ON SUCCESS
      setValues({});
      setOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-black text-xl font-semibold"
          disabled={showAddButton}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {fields.map((field) => (
            <Field key={field.name}>
              <Input
                placeholder={field.placeHolder}
                value={values[field.name] ?? ""}
                onChange={(e) => updateValue(field.name, e.target.value)}
                disabled={loading}
              />
            </Field>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Submit"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => {
              setValues({});
              setError(null);
            }}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
