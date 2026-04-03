import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "secondary";
  delay?: number;
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-primary/10 border-primary/20",
  secondary: "bg-secondary/10 border-secondary/20",
};

const iconVariant = {
  default: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
};

const StatCard = ({ title, value, icon: Icon, variant = "default", delay = 0 }: StatCardProps) => {
  return (
    <div
      className={`rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in ${variantStyles[variant]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${iconVariant[variant]}`} />
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
};

export default StatCard;
