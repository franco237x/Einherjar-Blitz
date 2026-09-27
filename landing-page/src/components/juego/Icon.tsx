import type { CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Ban,
  Box,
  Briefcase,
  Camera,
  ChartColumn,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleX,
  CloudOff,
  Cpu,
  Download,
  Droplet,
  Eye,
  EyeOff,
  FastForward,
  FileText,
  Flame,
  Gamepad2,
  Gem,
  GalleryVerticalEnd,
  House,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LayoutGrid,
  LogOut,
  Minus,
  Music,
  Orbit,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Send,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Store,
  Sun,
  Tag,
  Trophy,
  User,
  Users,
  Video,
  Volume2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon — maps the Ionicons names used by the mobile app to lucide-react
 * icons, so data files (gacha rewards, banners) can keep their icon keys.
 * The `-outline` suffix is ignored because lucide icons are outlined.
 */
const ICONS: Record<string, LucideIcon> = {
  add: Plus,
  albums: GalleryVerticalEnd,
  'alert-circle': CircleAlert,
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'bag-handle': ShoppingBag,
  ban: Ban,
  briefcase: Briefcase,
  camera: Camera,
  cart: ShoppingCart,
  checkmark: Check,
  'checkmark-circle': CircleCheck,
  'chevron-forward': ChevronRight,
  close: X,
  'close-circle': CircleX,
  'cloud-offline': CloudOff,
  cube: Box,
  diamond: Gem,
  'document-text': FileText,
  download: Download,
  ellipse: Circle,
  eye: Eye,
  'eye-off': EyeOff,
  flame: Flame,
  flash: Zap,
  'game-controller': Gamepad2,
  grid: LayoutGrid,
  'hardware-chip': Cpu,
  home: House,
  image: ImageIcon,
  key: KeyRound,
  layers: Layers,
  'log-out': LogOut,
  'musical-notes': Music,
  'paper-plane': Send,
  people: Users,
  person: User,
  planet: Orbit,
  play: Play,
  'play-forward': FastForward,
  pricetag: Tag,
  receipt: Receipt,
  refresh: RefreshCw,
  remove: Minus,
  save: Save,
  search: Search,
  share: Share2,
  shield: Shield,
  skull: Skull,
  snow: Snowflake,
  sparkles: Sparkles,
  star: Star,
  'stats-chart': ChartColumn,
  storefront: Store,
  sunny: Sun,
  'swap-horizontal': ArrowLeftRight,
  sync: RefreshCw,
  trophy: Trophy,
  video: Video,
  'volume-high': Volume2,
  water: Droplet,
};

export type IconName = string;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

/** Ionicons' solid variants that read as filled shapes (e.g. rarity stars). */
const FILLED = new Set(['star']);

export function Icon({ name, size = 20, color = 'currentColor', className, style, strokeWidth }: IconProps) {
  const Component = ICONS[name] ?? ICONS[name.replace(/-outline$/, '')] ?? Circle;
  return (
    <Component
      size={size}
      color={color}
      fill={FILLED.has(name) ? color : 'none'}
      className={className}
      style={style}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}

/** Google "G" logo — not part of lucide. */
export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
