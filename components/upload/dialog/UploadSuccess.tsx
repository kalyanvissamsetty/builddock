import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PublicUrlField } from "../PublicUrlField";
type Props = {
  isOpenSuccessDialog: boolean;
  setSuccessDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showActivateButton: boolean;
  activateVersion: () => Promise<boolean>;
};
export function UploadSuccess({
  isOpenSuccessDialog,
  setSuccessDialog,
  showActivateButton,
  activateVersion,
}: Props) {
  const [isActivationSuccess, setActivationSuccess] = useState(false);
  async function activateVersionOnButtonClick() {
    const active = await activateVersion();
    setActivationSuccess(active);
  }
  return (
    <Dialog
      open={isOpenSuccessDialog}
      onOpenChange={(open) => {
        setActivationSuccess(false);
        setSuccessDialog(open);
      }}
    >
      {/* <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Build Uploaded</DialogTitle>
          {showActivateButton && (
          <DialogDescription>
            Click <b>Activate</b> to set this version as default for this Environment
          </DialogDescription>)}
        </DialogHeader>
        
        <DialogFooter className="sm:justify-start">
          {showActivateButton && (
            <Button
              type="button"
              variant="default"
              onClick={activateVersionOnButtonClick}
              disabled={isActivationSuccess}
            >
              Activate
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
