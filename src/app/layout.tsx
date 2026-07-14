import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Uma única família tipográfica em toda a página (Inter). As variáveis
// --font-display/--font-mono continuam existindo para preservar a hierarquia
// visual (peso/tracking) usada em títulos e rótulos, mas todas apontam para
// a mesma fonte — sem misturar famílias diferentes.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenda NC",
  description: "Controle vivo de atividades, reuniões e planilhas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
