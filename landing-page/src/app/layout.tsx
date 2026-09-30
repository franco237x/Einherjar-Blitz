import type { Metadata, Viewport } from "next";
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
  title: "Einherjar Blitz | RPG de colección",
  description: "Einherjar Blitz es un RPG de colección en el Valhalla. Invoca guerreros, administra tu economía de llaves y esferas y prepárate para la arena, desde el navegador.",
  applicationName: "Einherjar Blitz",
  appleWebApp: { capable: true, title: "Einherjar", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
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
