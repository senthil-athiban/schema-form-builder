import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";

interface FormNameDialogProps {
  onSubmit: (values: { title: string; description: string }) => void;
  onCancel: () => void;
}

export const FormNameDialog: React.FC<FormNameDialogProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const trimmedTitle = title.trim();

  const handleSubmit = () => {
    if (!trimmedTitle) return;
    onSubmit({ title: trimmedTitle, description: description.trim() });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name your form</DialogTitle>
          <DialogDescription>
            Respondents see this at the top of the form. You can change it later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-form-title">Form name</Label>
            <Input
              id="new-form-title"
              value={title}
              placeholder="e.g. Contact us"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-form-description">Description (optional)</Label>
            <Input
              id="new-form-description"
              value={description}
              placeholder="e.g. We'll get back to you within a day"
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!trimmedTitle}>
            Create form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
