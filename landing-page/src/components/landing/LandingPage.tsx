'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FinalCta, SiteFooter } from './ClosingSections';
import { FeaturedCharacters } from './FeaturedCharacters';
import { GachaFeature } from './GachaFeature';
import { Hero } from './Hero';
import { PortalPillars } from './PortalPillars';
import { Progression } from './Progression';
import { SECTIONS, SiteHeader } from './SiteHeader';
import { startSmoothScroll } from './smoothScroll';
import './landing.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export function LandingPage() {
  const [activeSection, setActiveSection] = useState<string>('inicio');

  useEffect(() => startSmoothScroll(), []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn(inter.className, 'landing-grain relative min-h-screen bg-[#0b0a09] text-white antialiased')}>
        <SiteHeader activeSection={activeSection} />
        <main>
          <Hero />
          <PortalPillars />
          <FeaturedCharacters />
          <GachaFeature />
          <Progression />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
