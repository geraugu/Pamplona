// Color Palette for Finanças do Casal

export const colors = {
  // Primary Colors
  primary: {
    50: '#e6f1ff',
    100: '#b3d7ff',
    200: '#80bdff',
    300: '#4da3ff',
    400: '#1a89ff',
    500: '#0070f3', // Main primary color
    600: '#0059c2',
    700: '#004191',
    800: '#002a60',
    900: '#00142f',
  },

  // Secondary Colors
  secondary: {
    50: '#e6f4f1',
    100: '#b3e0d7',
    200: '#80ccbd',
    300: '#4db8a3',
    400: '#1aa489',
    500: '#00916f', // Main secondary color
    600: '#00745a',
    700: '#005744',
    800: '#003a2e',
    900: '#001d17',
  },

  // Accent Colors
  accent: {
    50: '#fff2e6',
    100: '#ffd9b3',
    200: '#ffbf80',
    300: '#ffa64d',
    400: '#ff8c1a',
    500: '#ff7300', // Main accent color
    600: '#cc5c00',
    700: '#994500',
    800: '#662e00',
    900: '#331700',
  },

  // Neutral Colors
  neutral: {
    50: '#f5f5f5',
    100: '#e0e0e0',
    200: '#cccccc',
    300: '#b3b3b3',
    400: '#999999',
    500: '#808080', // Main neutral color
    600: '#666666',
    700: '#4d4d4d',
    800: '#333333',
    900: '#1a1a1a',
  },

  // Semantic Colors
  success: {
    50: '#e6f5f0',
    100: '#b3e6d1',
    200: '#80d7b3',
    300: '#4dc894',
    400: '#1ab975',
    500: '#00ab57', // Main success color
    600: '#008a46',
    700: '#006a34',
    800: '#004b23',
    900: '#002b11',
  },

  error: {
    50: '#ffeaea',
    100: '#ffbdbd',
    200: '#ff9090',
    300: '#ff6363',
    400: '#ff3636',
    500: '#ff0000', // Main error color
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  // Background and Text
  background: '#ffffff',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    light: '#ffffff',
  },
};

// Tailwind Theme Extension
export const tailwindColorExtension = {
  primary: colors.primary[500],
  secondary: colors.secondary[500],
  accent: colors.accent[500],
  success: colors.success[500],
  error: colors.error[500],
  neutral: colors.neutral[500],
};
