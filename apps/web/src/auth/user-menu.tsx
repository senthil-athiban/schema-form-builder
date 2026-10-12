import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import { setCurrentWorkspaceId } from "@/shared/api/client";
import { useMeQuery } from "@/services/auth/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

const initialsOf = (name: string | null, email: string) =>
  (name?.trim() || email)
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMeQuery();
  if (!me) return null;

  const handleSignOut = async () => {
    await authClient.signOut();
    setCurrentWorkspaceId(null);
    queryClient.clear(); // the next user must not see this user's cached forms
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-200"
        >
          {initialsOf(me.user.name, me.user.email)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-slate-900">{me.user.name ?? "Account"}</p>
          <p className="truncate text-xs font-normal text-slate-500">{me.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-slate-500">
          <Building2 size={14} />
          <span className="truncate">{me.workspace.name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
