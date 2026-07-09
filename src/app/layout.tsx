import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secretária SaaS",
  description: "Painel de configuração da secretária virtual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}