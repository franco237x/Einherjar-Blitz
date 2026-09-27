'use client';

import { useEffect, useState } from 'react';
import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion';
import { ArenaTeaser } from './ArenaTeaser';
import { FinalCta, NewsSection, SideDots, SiteFooter } from './ClosingSections';
import { EconomyFlow } from './EconomyFlow';
import { GachaShowcase } from './GachaShowcase';
import { Hero } from './Hero';
import { PortalFeatures } from './PortalFeatures';
import { RankLadder } from './RankLadder';
import { RewardMarquee } from './RewardMarquee';
import { SECTIONS, SiteHeader } from './SiteHeader';
import './landing.css';

export function LandingPage() {
  const [activeSection, setActiveSection] = useState<string>('inicio');
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

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
      <div className="relative min-h-screen overflow-x-clip bg-black text-white">
        <motion.div
          className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-[#9e8b54] via-primary to-[#f3dca6]"
          style={{ scaleX: progress }}
          aria-hidden="true"
        />
        <SiteHeader activeSection={activeSection} />
        <SideDots activeSection={activeSection} />
        <main>
          <Hero />
          <RewardMarquee />
          <PortalFeatures />
          <GachaShowcase />
          <EconomyFlow />
          <RankLadder />
          <ArenaTeaser />
          <NewsSection />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
