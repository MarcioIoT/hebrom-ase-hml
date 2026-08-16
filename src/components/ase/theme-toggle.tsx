import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className="rounded-full text-muted-foreground hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun className="size-[1.1rem]" />
      ) : (
        <Moon className="size-[1.1rem]" />
      )}
    </Button>
  );
}
