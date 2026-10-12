import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { copyToClipboard } from "@/shared/lib/clipboard";

interface CopyLinkButtonProps {
  url: string;
  className?: string;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ url, className }) => {
  const [copied, setCopied] = useState(false);

  // "Copied" goes back to "Copy link" after 2s
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (await copyToClipboard(url)) setCopied(true);
    else window.prompt("Copy the public link:", url);
  };

  return (
    <button type="button" onClick={() => void handleCopy()} title={url} className={className}>
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
};
