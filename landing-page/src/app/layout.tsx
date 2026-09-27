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
  title: "Einherjar Blitz | Portal del Guerrero",
  description: "Juega Einherjar Blitz desde el navegador: invocaciones gacha, tienda, economía de llaves y esferas y rangos, con la misma cuenta de la app.",
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
