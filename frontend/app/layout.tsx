import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life Simulator",
  description: "Simulate your 10-year future and explore alternate paths",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen antialiased"
        style={{
          backgroundColor: "#f5f5f7",
          color: "#1d1d1f",
          fontFamily: "'SF Pro Text', 'SF Pro Icons', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            height: 48,
            display: "flex",
            alignItems: "center",
            paddingLeft: 24,
            paddingRight: 24,
            background: "rgba(0, 0, 0, 0.80)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
          }}
        >
          <a
            href="/"
            style={{
              fontSize: 17,
              fontWeight: 400,
              color: "#ffffff",
              textDecoration: "none",
              letterSpacing: "-0.374px",
            }}
          >
            AI Life Simulator
          </a>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
