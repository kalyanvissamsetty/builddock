import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/components/lib/api";
import { AssignedBuild } from "../Pages/Admin/ViewerAccessPage";
import { toast } from "sonner";

export function AssignedBuildsList({
  viewerId,
  builds,
  onChange,
}: {
  viewerId: number;
  builds: AssignedBuild[];
  onChange: () => void;
}) {
  async function remove(versionId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await apiFetch("/api/admin/viewer-access", {
      method: "DELETE",
      body: JSON.stringify({ userId: viewerId, versionId }),
    });

    if (response?.removed) toast.success("Build Access Removed");
    else toast.info(response.message);

    onChange();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium underline">Assigned Builds List</h2>

      <ScrollArea className="h-72 rounded border p-3">
        {builds.length === 0 ? (
          <div className="text-sm text-muted-foreground">No build assigned</div>
        ) : (
          <div className="space-y-3">
            {builds.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between  p-3"
              >
                <div className="text-sm">
                  {b.version.environment.project.name} /{" "}
                  {b.version.environment.name} / {b.version.name}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(b.versionId)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}