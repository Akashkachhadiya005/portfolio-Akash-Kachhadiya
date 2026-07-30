"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  const options = [
    { value: "light", icon: Sun, label: "Light mode" },
    { value: "dark", icon: Moon, label: "Dark mode" },
    { value: "system", icon: Monitor, label: "System mode" },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-md">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          className={cn(
            "rounded-full p-1.5 transition-all",
            theme === value
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
