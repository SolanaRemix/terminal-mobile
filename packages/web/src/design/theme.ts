import { colors, typography, spacing, radii } from "./tokens";

export function injectTheme(): void {
  const root = document.documentElement;
  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${kebab(key)}`, value);
  });
  // Typography
  root.style.setProperty("--font-mono", typography.fontMono);
  root.style.setProperty("--font-sans", typography.fontSans);
  Object.entries(typography.fontSizes).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
  // Radii
  Object.entries(radii).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });
}

function kebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}
