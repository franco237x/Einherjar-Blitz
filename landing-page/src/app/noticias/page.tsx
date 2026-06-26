"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, GitCommit } from "lucide-react";

export default function Noticias() {
  const news = [
    {
      id: 1,
      title: "¡Lanzamiento Oficial de Einherjar Blitz!",
      date: "25 de Junio, 2026",
      type: "Anuncio",
      content: "Es oficial. Después de meses de desarrollo, Einherjar Blitz por fin ha visto la luz del día. Ya puedes descargar el APK e iniciar tu aventura épica. Domina el gacha, forma tu equipo táctico y conquista la arena. ¡Nos vemos en el campo de batalla!",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 2,
      title: "Actualización v1.1.2 - Mejoras en Interfaz y Recompensas",
      date: "25 de Junio, 2026",
      type: "Parche",
      content: "Hemos solucionado diversos problemas de diseño en la pantalla de inventario. Ahora, el botón de 'Reclamar' en el sistema de gacha siempre es visible y respeta el flujo de la pantalla en cualquier resolución de móvil. Además, pulimos las 'Safe Areas' para que no haya solapamientos.",
      icon: <GitCommit className="w-5 h-5" />,
    },
    {
      id: 3,
      title: "Actualización v1.1.0 - Autenticación Nativa con Google",
      date: "Reciente",
      type: "Parche",
      content: "Se integró completamente el inicio de sesión nativo con Google OAuth, mejorando la seguridad y fluidez del acceso. También agregamos el 'Immersive Mode' para una experiencia a pantalla completa ininterrumpida y se corrigieron bugs menores en el formulario de registro y la Firebase Config.",
      icon: <GitCommit className="w-5 h-5" />,
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/einherjer-logo.jpg"
              alt="Einherjar Blitz Logo"
              width={32}
              height={32}
              className="rounded-md border border-primary/20"
            />
            <span className="font-['Cinzel'] font-bold text-xl tracking-widest text-primary">
              Einherjar Blitz
            </span>
          </div>
          <nav className="flex gap-6">
            <a href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-['Cinzel'] font-bold mb-12 text-foreground drop-shadow-lg border-b border-primary/20 pb-6">
            Últimas <span className="text-primary">Noticias</span>
          </h1>

          <div className="space-y-8">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-colors relative overflow-hidden group"
              >
                {/* Subtle highlight effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${item.type === 'Anuncio' ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wider uppercase text-primary mb-1">
                      {item.type}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {item.date}
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold font-['Cinzel'] text-foreground mb-4">
                  {item.title}
                </h2>
                
                <p className="text-muted-foreground leading-relaxed">
                  {item.content}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 bg-black/40 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-70">
            <Image
              src="/assets/einherjer-logo.jpg"
              alt="Logo"
              width={24}
              height={24}
              className="rounded opacity-50 grayscale"
            />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Einherjar Blitz. Juego en desarrollo.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
