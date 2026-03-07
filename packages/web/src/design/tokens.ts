// Design tokens for CyberAi Terminal dark theme

export const colors = {
  // Backgrounds
  bgPrimary: "#0d1117",
  bgSurface: "#161b22",
  bgElevated: "#21262d",
  bgOverlay: "#30363d",

  // Brand / accent
  terminalGreen: "#39d353",
  terminalGreenDim: "#2ea043",
  accentCyan: "#58a6ff",
  accentCyanDim: "#1f6feb",

  // Status
  warning: "#e3b341",
  warningDim: "#9e6a03",
  error: "#f85149",
  errorDim: "#b91c1c",
  success: "#3fb950",

  // Text
  textPrimary: "#e6edf3",
  textSecondary: "#8b949e",
  textMuted: "#6e7681",
  textInverse: "#0d1117",

  // Borders
  border: "#30363d",
  borderMuted: "#21262d",
} as const;

export const typography = {
  fontMono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
  fontSans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const radii = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.4)",
  md: "0 4px 12px rgba(0,0,0,0.5)",
  lg: "0 8px 24px rgba(0,0,0,0.6)",
} as const;

export const transitions = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "400ms ease",
} as const;
