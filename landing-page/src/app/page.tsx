"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Shield,
  Swords,
  Star,
  Menu,
  X,
  Smartphone,
  Cpu,
  HardDrive,
  Wifi,
  Newspaper,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   Section definitions for the side‐dot navigator
   ───────────────────────────────────────────── */
const SECTIONS = [
  { id: "hero", label: "Inicio" },
  { id: "features", label: "Características" },
  { id: "requirements", label: "Requisitos" },
  { id: "download", label: "Descargar" },
] as const;

/* ─────────────────────────────────────────────
   Smooth‐scroll helper (JS‐based, reliable)
   ───────────────────────────────────────────── */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerOffset = 80; // sticky header height
  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  /* Track which section is in view */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = useCallback(
    (id: string) => {
      setMenuOpen(false);
      // Small timeout so the menu collapses before scrolling
      setTimeout(() => scrollToSection(id), 100);
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      {/* ═══ Header ═══ */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/einherjer-logo.jpg"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-md border border-primary/20"
            />
            <span className="font-[Cinzel] font-bold text-lg tracking-widest text-primary hidden min-[360px]:inline">
              Einherjar Blitz
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 items-center">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
            <a
              href="/noticias"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Noticias
            </a>
          </nav>

          {/* Hamburger */}
          <button
            className="md:hidden relative z-50 text-primary p-2 -mr-2"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile full‑screen menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute inset-x-0 top-14 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-2xl"
            >
              <div className="flex flex-col p-5 space-y-1">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className={`text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      activeSection === id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-primary/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <a
                  href="/noticias"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-primary/5 transition-all"
                >
                  <Newspaper className="w-4 h-4 text-primary" />
                  Noticias
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ Side Dot Navigator (hidden on small phones, visible from sm+) ═══ */}
      <div className="hidden sm:flex fixed right-1.5 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="group relative flex items-center"
            aria-label={label}
          >
            {/* Tooltip */}
            <span className="absolute right-6 bg-card border border-border/60 text-foreground text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {label}
            </span>
            {/* Dot */}
            <span
              className={`block rounded-full transition-all duration-300 ${
                activeSection === id
                  ? "w-3 h-3 bg-primary shadow-[0_0_8px_rgba(201,170,113,0.7)]"
                  : "w-2 h-2 bg-muted-foreground/40 hover:bg-primary/60"
              }`}
            />
          </button>
        ))}
      </div>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col items-center">
        {/* ── Hero ── */}
        <section
          id="hero"
          className="w-full min-h-[85vh] flex flex-col items-center justify-center px-5 py-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-6 flex justify-center">
              <Image
                src="/assets/einherjer-logo.jpg"
                alt="Einherjar Blitz"
                width={120}
                height={120}
                className="rounded-2xl border border-primary/30 shadow-[0_0_50px_rgba(201,170,113,0.35)]"
              />
            </div>

            <h1 className="text-4xl min-[400px]:text-5xl md:text-7xl font-[Cinzel] font-bold tracking-tight mb-4 leading-[1.1]">
              Forja tu <span className="text-primary">Destino</span>
            </h1>

            <p className="text-base min-[400px]:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
              El RPG táctico con invocaciones gacha. Recluta guerreros
              legendarios y conquista la arena multijugador.
            </p>

            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="/einherjar-blitz-latest.apk"
              download="Einherjar_Blitz_Latest.apk"
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-bold text-base shadow-[0_0_24px_rgba(201,170,113,0.45)] hover:shadow-[0_0_32px_rgba(201,170,113,0.65)] transition-all"
            >
              <Download className="w-5 h-5" />
              Descargar APK
            </motion.a>

            <p className="text-xs text-muted-foreground mt-3">
              v1.1.2 • Android 8.0+
            </p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-12 text-muted-foreground/40"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </section>

        {/* ── Features (Timeline style) ── */}
        <section
          id="features"
          className="w-full max-w-3xl px-5 py-20"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl min-[400px]:text-3xl font-[Cinzel] font-bold text-center mb-14"
          >
            Características del <span className="text-primary">Juego</span>
          </motion.h2>

          {/* Vertical Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 min-[400px]:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

            {[
              {
                icon: <Star className="w-5 h-5" />,
                title: "Invocaciones Gacha",
                desc: "Colecciona héroes míticos. Cada tirada es una oportunidad con animaciones cinematográficas espectaculares.",
                delay: 0.1,
              },
              {
                icon: <Swords className="w-5 h-5" />,
                title: "Combate Táctico",
                desc: "No basta con fuerza bruta. Forma el equipo perfecto, domina sinergias y derrota enemigos con pura estrategia.",
                delay: 0.2,
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Rango y Gloria",
                desc: "Compite contra otros jugadores, sube de rango, obtén copas y demuestra quién es el verdadero campeón.",
                delay: 0.3,
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: feature.delay }}
                className="relative pl-14 min-[400px]:pl-16 pb-12 last:pb-0"
              >
                {/* Dot on timeline */}
                <div className="absolute left-3 min-[400px]:left-4 top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <div className="bg-card/30 backdrop-blur-sm border border-border/40 rounded-2xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-[Cinzel] font-bold">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Requirements ── */}
        <section
          id="requirements"
          className="w-full max-w-3xl px-5 py-20"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl min-[400px]:text-3xl font-[Cinzel] font-bold text-center mb-10"
          >
            Requisitos del <span className="text-primary">Sistema</span>
          </motion.h2>

          <div className="grid grid-cols-1 min-[500px]:grid-cols-2 gap-4">
            {/* Minimum */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card/30 border border-border/40 rounded-2xl p-5"
            >
              <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-primary/20 font-[Cinzel]">
                Mínimos
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { icon: <Smartphone className="w-4 h-4" />, label: "SO", value: "Android 8.0+" },
                  { icon: <Cpu className="w-4 h-4" />, label: "RAM", value: "2 GB" },
                  { icon: <HardDrive className="w-4 h-4" />, label: "Espacio", value: "250 MB" },
                  { icon: <Wifi className="w-4 h-4" />, label: "Red", value: "Conexión requerida" },
                ].map((req) => (
                  <li key={req.label} className="flex items-center gap-3">
                    <span className="text-primary/60">{req.icon}</span>
                    <span>
                      <strong className="text-foreground">{req.label}: </strong>
                      <span className="text-muted-foreground">{req.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Recommended */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card/30 border border-primary/20 rounded-2xl p-5 relative overflow-hidden"
            >
              {/* Gold accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-primary/20 font-[Cinzel]">
                Recomendados ✦
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { icon: <Smartphone className="w-4 h-4" />, label: "SO", value: "Android 11+" },
                  { icon: <Cpu className="w-4 h-4" />, label: "RAM", value: "4 GB o más" },
                  { icon: <HardDrive className="w-4 h-4" />, label: "Espacio", value: "500 MB" },
                  { icon: <Wifi className="w-4 h-4" />, label: "Red", value: "Wi-Fi / 4G estable" },
                ].map((req) => (
                  <li key={req.label} className="flex items-center gap-3">
                    <span className="text-primary/60">{req.icon}</span>
                    <span>
                      <strong className="text-foreground">{req.label}: </strong>
                      <span className="text-muted-foreground">{req.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ── Download CTA ── */}
        <section
          id="download"
          className="w-full max-w-3xl px-5 py-20 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/20 border border-primary/20 rounded-3xl p-8 min-[400px]:p-10 relative overflow-hidden"
          >
            {/* Gold line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <h2 className="text-2xl min-[400px]:text-3xl font-[Cinzel] font-bold mb-3">
              ¿Listo para la <span className="text-primary">Batalla</span>?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Descarga ahora el APK oficial y comienza tu aventura. El destino
              de los Einherjar está en tus manos.
            </p>

            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="/einherjar-blitz-latest.apk"
              download="Einherjar_Blitz_Latest.apk"
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(201,170,113,0.5)] hover:shadow-[0_0_40px_rgba(201,170,113,0.7)] transition-all"
            >
              <Download className="w-6 h-6" />
              Descargar para Android
            </motion.a>

            <p className="text-xs text-muted-foreground mt-4">
              v1.1.2 • ~115 MB • Android 8.0 (Oreo) o superior
            </p>
          </motion.div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="w-full border-t border-border/40 py-6 bg-black/40 mt-auto">
        <div className="max-w-6xl mx-auto px-5 flex flex-col min-[400px]:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 opacity-60">
            <Image
              src="/assets/einherjer-logo.jpg"
              alt="Logo"
              width={20}
              height={20}
              className="rounded opacity-50 grayscale"
            />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Einherjar Blitz
            </p>
          </div>
          <p className="text-xs text-muted-foreground opacity-50">
            Juego en desarrollo
          </p>
        </div>
      </footer>
    </div>
  );
}
