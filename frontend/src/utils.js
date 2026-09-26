export function scoreTone(score) {
  if (score == null) return '';
  if (score >= 70) return 'good';
  if (score >= 45) return 'warn';
  return 'risk';
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const AVATAR_HUES = [152, 168, 190, 205, 25, 260, 340];

export function avatarHue(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[hash % AVATAR_HUES.length];
}

import {
  Coffee, Dumbbell, Sparkles, Laptop, Home as HomeIcon, ShoppingBag, GraduationCap, UtensilsCrossed, Building2,
} from 'lucide-react';

const INDUSTRY_ICONS = [
  [/food|beverage|cafe|coffee|restaurant/i, Coffee],
  [/delivery|qsr|kitchen/i, UtensilsCrossed],
  [/fitness|wellness|gym|health/i, Dumbbell],
  [/beauty|personal care|cosmetic/i, Sparkles],
  [/edtech|education|learning/i, GraduationCap],
  [/tech|saas|software/i, Laptop],
  [/home|furniture|decor|living/i, HomeIcon],
  [/fashion|apparel|retail/i, ShoppingBag],
];

export function industryIcon(industry = '') {
  const hit = INDUSTRY_ICONS.find(([re]) => re.test(industry));
  return hit ? hit[1] : Building2;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
