export const formatValue = (value) => Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  useGrouping: false,
}).format(Number(value) || 0);

export const formatThousands = (value) => Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  useGrouping: false,
}).format(Number(value) || 0);

export const getCssVariable = (variable) => {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

const stripTrailingSlash = (url) => String(url || '').replace(/\/+$/, '');

export const GLOBAL_CONFIG = {
  // Backend service root, shared by all pages/components.
  SERVER_BASE_URL: stripTrailingSlash(import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000'),
  // Keep compatibility: explicit VITE_API_BASE_URL has higher priority.
  API_BASE_URL: stripTrailingSlash(
    import.meta.env.VITE_API_BASE_URL
      || `${stripTrailingSlash(import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000')}/api`
  ),
};

const adjustHexOpacity = (hexColor, opacity) => {
  // Remove the '#' if it exists
  hexColor = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const adjustHSLOpacity = (hslColor, opacity) => {
  // Convert HSL to HSLA
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
};

const adjustOKLCHOpacity = (oklchColor, opacity) => {
  // Add alpha value to OKLCH color
  return oklchColor.replace(/oklch\((.*?)\)/, (match, p1) => `oklch(${p1} / ${opacity})`);
};

export const adjustColorOpacity = (color, opacity) => {
  if (color.startsWith('#')) {
    return adjustHexOpacity(color, opacity);
  } else if (color.startsWith('hsl')) {
    return adjustHSLOpacity(color, opacity);
  } else if (color.startsWith('oklch')) {
    return adjustOKLCHOpacity(color, opacity);
  } else {
    throw new Error('Unsupported color format');
  }
};

export const oklchToRGBA = (oklchColor) => {
  // Create a temporary div to use for color conversion
  const tempDiv = document.createElement('div');
  tempDiv.style.color = oklchColor;
  document.body.appendChild(tempDiv);
  
  // Get the computed style and convert to RGB
  const computedColor = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);
  
  return computedColor;
};