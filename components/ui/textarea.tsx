import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/components/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  clearable?: boolean;
};

function Textarea({ className, clearable, ...props }: TextareaProps) {
  const dataSlotValue = (props as Record<string, unknown>)["data-slot"];
  const dataSlot = typeof dataSlotValue === "string" ? dataSlotValue : undefined;
  const supportsClear =
    typeof props.value === "string" &&
    typeof props.onChange === "function" &&
    !props.disabled &&
    !props.readOnly &&
    clearable !== false &&
    dataSlot !== "input-group-control";
  const showClear = supportsClear && typeof props.value === "string" && props.value.length > 0;

  const textarea = (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        supportsClear && "pr-9",
        className
      )}
      {...props}
    />
  );

  if (!supportsClear) return textarea;

  return (
    <div className="relative w-full">
      {textarea}
      {showClear && (
        <button
          type="button"
          aria-label="Clear text"
          className="text-muted-foreground hover:text-foreground absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-sm"
          onClick={() => {
            props.onChange?.({
              target: { value: "" },
              currentTarget: { value: "" },
            } as React.ChangeEvent<HTMLTextAreaElement>);
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export { Textarea }
