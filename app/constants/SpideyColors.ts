/**
 * SPIDEY Color Configuration
 * Supports dynamic color adjustment for accent colors
 */

export interface SpideyColorScheme {
  background: string;
  primary: string;
  accent1: string;
  accent2: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string,
  border: string;
  alertRed: string;
  statusOn: string;
  statusOff: string;
}

// Default SPIDEY color scheme
export const DEFAULT_COLORS: SpideyColorScheme = {
  background: '#000000',
  primary: '#1800ad',
  accent1: '#8c52ff',
  accent2: '#8241f5',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#AAAAAA',
  border: '#333333',
  alertRed: '#FF0000',
  statusOn: '#00FF00',
  statusOff: '#666666',
};

// Alternative color schemes for dynamic adjustment
export const ALTERNATIVE_SCHEMES = {
  blue: {
    ...DEFAULT_COLORS,
    primary: '#0066cc',
    accent1: '#3399ff',
    accent2: '#1a8cff',
  },
  purple: {
    ...DEFAULT_COLORS,
    primary: '#6a0dad',
    accent1: '#9370db',
    accent2: '#8a2be2',
  },
  cyan: {
    ...DEFAULT_COLORS,
    primary: '#008b8b',
    accent1: '#00ced1',
    accent2: '#20b2aa',
  },
};

/**
 * Adjust color brightness
 * @param color Hex color string
 * @param percent Percentage to adjust (-100 to 100)
 */
export function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Create custom color scheme with custom accent colors
 */
export function createCustomScheme(
  primary: string,
  accent1: string,
  accent2: string
): SpideyColorScheme {
  return {
    ...DEFAULT_COLORS,
    primary,
    accent1,
    accent2,
  };
}

// Export current active color scheme (can be modified at runtime)
let activeColorScheme: SpideyColorScheme = DEFAULT_COLORS;

export function getActiveColorScheme(): SpideyColorScheme {
  return activeColorScheme;
}

export function setActiveColorScheme(scheme: SpideyColorScheme): void {
  activeColorScheme = scheme;
}
