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

// Generic, category-representative stock photos (not photos of the user's actual business).
const UNSPLASH = (id) => `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=80`;
const INDUSTRY_PHOTOS = [
  [/food|beverage|cafe|coffee|restaurant/i, UNSPLASH('1495474472287-4d71bcdd2085')],
  [/delivery|qsr|kitchen/i, UNSPLASH('1517248135467-4c7edcad34c4')],
  [/fitness|wellness|gym|health/i, UNSPLASH('1534438327276-14e5300c3a48')],
  [/beauty|personal care|cosmetic/i, UNSPLASH('1596462502278-27bfdc403348')],
  [/edtech|education|learning/i, UNSPLASH('1522202176988-66273c2fd55f')],
  [/tech|saas|software/i, UNSPLASH('1517245386807-bb43f82c33c4')],
  [/home|furniture|decor|living/i, UNSPLASH('1567016432779-094069958ea5')],
  [/fashion|apparel|retail/i, UNSPLASH('1441986300917-64674bd600d8')],
];
const DEFAULT_PHOTO = UNSPLASH('1522202176988-66273c2fd55f');

export function industryPhoto(industry = '') {
  const hit = INDUSTRY_PHOTOS.find(([re]) => re.test(industry));
  return hit ? hit[1] : DEFAULT_PHOTO;
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
