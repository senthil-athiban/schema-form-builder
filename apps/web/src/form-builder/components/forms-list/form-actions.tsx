import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Ellipsis,
  ExternalLink,
  EyeOff,
  Loader2,
  Pencil,
  Send,
  Table2,
  Workflow,
} from "lucide-react";
import { getPublicFormUrl } from "@/shared/api";
import type { FormListItem } from "@/shared/api/types";
import { copyToClipboard } from "@/shared/lib/clipboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { actionButtonClass } from "./forms-list.utils";

export interface FormActionHandlers {
  onPublish: (form: FormListItem) => void;
  onUnpublish: (form: FormListItem) => void;
  busyFormId: string | null;
}

interface ShareButtonProps {
  publicUrl: string | null;
  busy: boolean;
  onPublish: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ publicUrl, busy, onPublish }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleClick = async () => {
    if (!publicUrl) {
      onPublish();
      return;
    }
    if (await copyToClipboard(publicUrl)) setCopied(true);
    else window.prompt("Copy the public link:", publicUrl);
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      title={publicUrl ? "Copy public link" : "Publish and copy link"}
      className={actionButtonClass}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : copied ? <Check size={15} /> : <Send size={15} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
};

export const FormActions: React.FC<{ form: FormListItem } & FormActionHandlers> = ({
  form,
  onPublish,
  onUnpublish,
  busyFormId,
}) => {
  const isLive = form.status === "PUBLISHED";
  const publicUrl = isLive && form.publicToken ? getPublicFormUrl(form.publicToken) : null;
  const busy = busyFormId === form.id;

  return (
    <div className="flex items-center justify-end gap-2">
      {publicUrl ? (
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
          <ExternalLink size={15} />
          View
        </a>
      ) : (
        <Link to={`/forms/${form.id}`} className={actionButtonClass}>
          <Pencil size={15} />
          Edit
        </Link>
      )}

      <ShareButton publicUrl={publicUrl} busy={busy} onPublish={() => onPublish(form)} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`More actions for ${form.name}`} className={`${actionButtonClass} px-2`}>
            <Ellipsis size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link to={`/forms/${form.id}`}>
              <Pencil />
              Edit form
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/forms/${form.id}/submissions`}>
              <Table2 />
              View submissions
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/forms/${form.id}/workflows`}>
              <Workflow />
              Workflows
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={busy} onSelect={() => onPublish(form)}>
            <Send />
            {isLive ? "Re-publish latest version" : "Publish"}
          </DropdownMenuItem>
          {isLive && (
            <DropdownMenuItem variant="destructive" disabled={busy} onSelect={() => onUnpublish(form)}>
              <EyeOff />
              Unpublish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
