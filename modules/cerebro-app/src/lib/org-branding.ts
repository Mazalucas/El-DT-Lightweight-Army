import type { Organization } from '@shared/types.js';

const ORG_ACCENT_VARS = ['--accent', '--accent-hover', '--accent-muted', '--info'] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1]!, 16), g: parseInt(m[2]!, 16), b: parseInt(m[3]!, 16) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function mixHex(hex: string, amount: number, toward: 'black' | 'white'): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = toward === 'white' ? 255 : 0;
  const mix = (c: number) => Math.round(c + (t - c) * amount);
  const r = mix(rgb.r).toString(16).padStart(2, '0');
  const g = mix(rgb.g).toString(16).padStart(2, '0');
  const b = mix(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function accentMuted(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'oklch(0.58 0.11 195 / 0.15)';
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const alpha = lum > 0.5 ? 0.18 : 0.22;
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

export function applyOrgBranding(org: Organization | null | undefined): void {
  clearOrgBranding();
  const accent = org?.branding?.accentColor?.trim();
  if (!accent || !hexToRgb(accent)) return;

  const root = document.documentElement;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-hover', mixHex(accent, 0.12, 'black'));
  root.style.setProperty('--accent-muted', accentMuted(accent));
  root.style.setProperty('--info', accent);
  root.dataset.orgBranded = org?.id ?? 'true';
}

export function clearOrgBranding(): void {
  const root = document.documentElement;
  for (const v of ORG_ACCENT_VARS) root.style.removeProperty(v);
  delete root.dataset.orgBranded;
}

export function orgDisplayName(org: Organization): string {
  return org.branding?.displayName?.trim() || org.name;
}

export function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const ACCENT_PRESETS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];
