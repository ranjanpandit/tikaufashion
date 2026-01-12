export const runtime = "nodejs";
import Providers from "./providers";

import "./globals.css";

async function getStore() {
  try {
    const res = await fetch("http://localhost:3000/api/store", {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }) {
  const store = await getStore();
  const theme = store?.theme || {};

  return (
    <html lang="en">
      <body
        style={{
          "--brand-primary": theme.primaryColor || "#000000",
          "--brand-secondary": theme.secondaryColor || "#666666",
          "--button-radius": theme.buttonRadius || "0.375rem",
          "--font-family":
            theme.fontFamily ||
            "Inter, system-ui, sans-serif",
        }}
      >
                <Providers>{children}</Providers>

      </body>
    </html>
  );
}
