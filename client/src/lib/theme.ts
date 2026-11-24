export interface ThemeVisual {
  gradient: string;
  soft: string;
  accent: string;
  label: string;
}

const COURSE_THEMES: Record<string, ThemeVisual> = {
  navy: { gradient: 'linear-gradient(135deg,#111827,#334155)', soft: '#eef2f8', accent: '#334155', label: 'Navy' },
  orange: { gradient: 'linear-gradient(135deg,#f97316,#fb923c)', soft: '#fff1e7', accent: '#f97316', label: 'Orange' },
  emerald: { gradient: 'linear-gradient(135deg,#059669,#34d399)', soft: '#ecfdf5', accent: '#10b981', label: 'Emerald' },
  violet: { gradient: 'linear-gradient(135deg,#6d28d9,#a78bfa)', soft: '#f5f3ff', accent: '#8b5cf6', label: 'Violet' },
  amber: { gradient: 'linear-gradient(135deg,#b45309,#fbbf24)', soft: '#fffbeb', accent: '#f59e0b', label: 'Amber' },
  sky: { gradient: 'linear-gradient(135deg,#0369a1,#38bdf8)', soft: '#f0f9ff', accent: '#0ea5e9', label: 'Sky' },
  indigo: { gradient: 'linear-gradient(135deg,#3730a3,#818cf8)', soft: '#eef2ff', accent: '#6366f1', label: 'Indigo' },
  teal: { gradient: 'linear-gradient(135deg,#0f766e,#2dd4bf)', soft: '#f0fdfa', accent: '#14b8a6', label: 'Teal' },
  fuchsia: { gradient: 'linear-gradient(135deg,#a21caf,#e879f9)', soft: '#fdf4ff', accent: '#d946ef', label: 'Fuchsia' },
  rose: { gradient: 'linear-gradient(135deg,#be123c,#fb7185)', soft: '#fff1f2', accent: '#f43f5e', label: 'Rose' },
  accent: { gradient: 'linear-gradient(135deg,#111827,#f97316)', soft: '#fff7ed', accent: '#f97316', label: 'EduPulse' },
};

export function courseTheme(theme: string | null | undefined): ThemeVisual {
  return COURSE_THEMES[theme || 'navy'] || COURSE_THEMES.navy;
}

export const CATEGORY_META: Record<string, { label: string; accent: string; soft: string }> = {
  jee: { label: 'JEE', accent: '#f97316', soft: '#fff1e7' },
  neet: { label: 'NEET', accent: '#10b981', soft: '#ecfdf5' },
  upsc: { label: 'UPSC', accent: '#6366f1', soft: '#eef2ff' },
  ssc: { label: 'SSC', accent: '#f43f5e', soft: '#fff1f2' },
  banking: { label: 'Banking', accent: '#0ea5e9', soft: '#f0f9ff' },
  gate: { label: 'GATE', accent: '#8b5cf6', soft: '#f5f3ff' },
  cuet: { label: 'CUET', accent: '#f59e0b', soft: '#fffbeb' },
  school: { label: 'School', accent: '#14b8a6', soft: '#f0fdfa' },
  foundation: { label: 'Foundation', accent: '#d946ef', soft: '#fdf4ff' },
};

export function categoryLabel(slug: string) {
  return CATEGORY_META[slug]?.label || slug.toUpperCase();
}
