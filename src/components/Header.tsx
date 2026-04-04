import { Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 transition-theme">
      <h1 className="text-2xl font-bold tracking-tight">
        💑 BremersBank
      </h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md border border-border"
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4" />
              Dark
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              Light
            </>
          )}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md border border-border text-destructive"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  );
};

export default Header;
