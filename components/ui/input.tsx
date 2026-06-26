import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/components/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  clearable?: boolean;
};

function shouldSupportClearButton({
  value,
  onChange,
  disabled,
  readOnly,
  type,
  dataSlot,
  clearable,
}: {
  value: React.ComponentProps<"input">["value"];
  onChange: React.ComponentProps<"input">["onChange"];
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  dataSlot?: string;
  clearable?: boolean;
}) {
  const nonClearableTypes = new Set(["button", "checkbox", "file", "hidden", "image", "radio", "range", "reset", "submit"]);
  return (
    clearable !== false &&
    typeof value === "string" &&
    typeof onChange === "function" &&
    !disabled &&
    !readOnly &&
    dataSlot !== "input-group-control" &&
    !nonClearableTypes.has(type ?? "text")
  );
}

function Input({ className, type, clearable, ...props }: InputProps) {
  const dataSlotValue = (props as Record<string, unknown>)["data-slot"];
  const dataSlot = typeof dataSlotValue === "string" ? dataSlotValue : undefined;
  const supportsClear = shouldSupportClearButton({
    value: props.value,
    onChange: props.onChange,
    disabled: props.disabled,
    readOnly: props.readOnly,
    type,
    dataSlot,
    clearable,
  });
  const showClear = supportsClear && typeof props.value === "string" && props.value.length > 0;

  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        supportsClear && "pr-9",
        className
      )}
      {...props}
    />
  );

  if (!supportsClear) return input;

  return (
    <div className="relative w-full">
      {input}
      {showClear && (
        <button
          type="button"
          aria-label="Clear input"
          className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm"
          onClick={() => {
            props.onChange?.({
              target: { value: "" },
              currentTarget: { value: "" },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export { Input }
