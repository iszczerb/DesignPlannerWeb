/**
 * Color utility functions for task cards and UI components
 */

/**
 * Converts hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Darkens a hex color by a percentage
 */
export function darkenColor(hex: string, percentage: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = (100 - percentage) / 100;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}

/**
 * Lightens a hex color by a percentage
 */
export function lightenColor(hex: string, percentage: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percentage / 100;
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * factor),
    Math.round(rgb.g + (255 - rgb.g) * factor),
    Math.round(rgb.b + (255 - rgb.b) * factor)
  );
}

/**
 * Gets text color (black or white) based on background color contrast
 */
export function getTextColor(backgroundHex: string): string {
  const rgb = hexToRgb(backgroundHex);
  if (!rgb) return '#212529';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // Use white text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? '#212529' : '#ffffff';
}

/**
 * Creates iOS 26 Liquid Glass inspired color scheme for task cards
 */
export function createCardColorScheme(baseColor: string) {
  const baseHex = baseColor || '#3b82f6';

  return {
    background: baseHex, // Use the actual rich color
    border: darkenColor(baseHex, 25), // Much darker border for strong definition
    text: '#ffffff', // Always white text for contrast
    gradient: {
      start: lightenColor(baseHex, 15), // Slightly lighter for gradient top
      end: darkenColor(baseHex, 20)     // Darker for gradient bottom
    },
    glass: {
      highlight: lightenColor(baseHex, 40), // Glass highlight effect
      shadow: darkenColor(baseHex, 30)      // Deep shadow for depth
    }
  };
}