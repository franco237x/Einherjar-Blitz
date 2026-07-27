import type { Metadata, Viewport } from "next";

const title = "MACROSCOP — Señal K-19 | Einherjar Blitz";
const description =
  "Minijuego interactivo de terror psicológico: vigila una señal imposible desde el observatorio K-19, conserva la cordura y evita que algo aprenda a mirarte.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Einherjar Blitz",
  category: "game",
  keywords: [
    "Einherjar Blitz",
    "MACROSCOP",
    "minijuego de terror",
    "terror psicológico",
    "terror cósmico",
    "ficción interactiva",
    "observatorio K-19",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "es_AR",
    siteName: "Einherjar Blitz",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#020202",
};

export default function MacrocosmosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}