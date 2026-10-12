import { ChevronRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconClass: string;
  value: number;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, iconClass, value, label, active, onClick }) => {
  const content = (
    <>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      {onClick && <ChevronRight size={18} className="shrink-0 text-slate-400" />}
    </>
  );

  const baseClass = `flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm transition ${
    active ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
  }`;

  return onClick ? (
    <button type="button" onClick={onClick} className={`${baseClass} hover:border-slate-300`}>
      {content}
    </button>
  ) : (
    <div className={baseClass}>{content}</div>
  );
};
