"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url: string;
};

export function PublicUrlField({ url }: Props) {
  function handleCopy(e: React.MouseEvent<HTMLInputElement>) {
    e.currentTarget.select();
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={url}
        readOnly
        className="cursor-pointer"
        onClick={handleCopy}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}
