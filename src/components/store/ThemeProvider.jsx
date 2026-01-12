"use client";

import { useEffect } from "react";

export default function ThemeProvider({ theme }) {
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;

    root.style.setProperty("--color-primary", theme.primaryColor || "#000000");
    root.style.setProperty(
      "--color-secondary",
      theme.secondaryColor || "#666666"
    );
    root.style.setProperty(
      "--btn-radius",
      theme.buttonRadius || "0.375rem"
    );
    root.style.setProperty(
      "--font-family",
      theme.fontFamily || "Inter, system-ui, sans-serif"
    );
  }, [theme]);

  return null;
}
