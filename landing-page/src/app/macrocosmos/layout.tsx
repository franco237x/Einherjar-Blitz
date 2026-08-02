import type { Metadata, Viewport } from "next";

const title = "K-19 — Señal imposible | Einherjar Blitz";
const description =
  "Minijuego interactivo de terror psicológico: sobrevive a la señal imposible del observatorio K-19 antes de que aprenda a mirarte.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Einherjar Blitz",
  category: "game",
  keywords: [
    "Einherjar Blitz",
    "K-19",
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
