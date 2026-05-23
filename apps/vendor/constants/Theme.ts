export const Theme = {
  colors: {
    primary: '#EA580C',     // Vibrant Orange (Ola/Rapido/Uber India-first energy)
    secondary: '#0F172A',   // Deep Navy Accent
    success: '#10B981',     // Success Green
    danger: '#EF4444',      // Danger Red
    warning: '#F59E0B',     // Warning Amber
    info: '#3B82F6',        // Info Blue
    background: {
      light: '#F8FAFC',
      dark: '#0F172A',
    },
    card: {
      light: '#FFFFFF',
      dark: '#1E293B',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      light: '#FFFFFF',
      muted: '#94A3B8',
    }
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    }
  }
};
