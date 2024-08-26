import type { Metadata } from "next";
import "./globals.css";
import ThemeProviderWrapper from "./ThemeProviderWrapper"; // Import the client-side theme provider

export const metadata: Metadata = {
  title: "Drools Rule Management",
  description: "Manage rules for Drools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
