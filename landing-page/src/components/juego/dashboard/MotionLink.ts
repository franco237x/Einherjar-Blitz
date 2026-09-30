'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/** next/link with framer-motion props (entrance, whileTap, whileHover...). */
export const MotionLink = motion.create(Link);
