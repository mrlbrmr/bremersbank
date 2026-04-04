import { Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardHeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const DashboardHeader = ({ theme, onToggleTheme }: DashboardHeaderProps) => {
  const { session, signOut } = useAuth();

  const firstName = session?.user?.email?.split("@")[0] || "Usuário";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="flex items-center justify-between py-5">
      <div>
        <h1 className="text-lg font-bold tracking-tight">
          {greeting}, <span className="text-primary capitalize">{firstName}</span> 👋
        </h1>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:shadow-sm transition-all"
          aria-label="Alternar tema"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <button
          onClick={signOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-destructive hover:shadow-sm transition-all"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
