import type { Metadata } from "next";
import { Cinzel, Barlow } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Einherjar Blitz | Descargar APK",
  description: "Descarga la última versión de Einherjar Blitz. Sumérgete en este RPG táctico con invocaciones gacha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark scroll-smooth scroll-pt-20">
      <body
        className={`${barlow.className} ${cinzel.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
