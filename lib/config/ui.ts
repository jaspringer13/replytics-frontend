/**
 * UI and theme configuration
 * All UI constants, theme values, and styling configuration
 */

export const UI_CONFIG = {
  // Theme colors
  THEME: {
    COLORS: {
      // Brand colors
      BRAND: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
      },
      
      // Semantic colors
      SUCCESS: '#10b981',
      WARNING: '#f59e0b',
      ERROR: '#ef4444',
      INFO: '#3b82f6',
      
      // Chart colors
      CHART: {
        PRIMARY: '#8B5CF6',
        SECONDARY: '#3B82F6',
        TERTIARY: '#10B981',
        QUATERNARY: '#F59E0B',
        QUINARY: '#EF4444',
        SENARY: '#6366F1',
      },
      
      // Customer segment colors
      SEGMENTS: {
        VIP: '#8B5CF6',
        REGULAR: '#3B82F6',
        AT_RISK: '#F59E0B',
        NEW: '#10B981',
        DORMANT: '#6B7280',
      },
    },
    
    // Dark mode specific
    DARK: {
      BACKGROUND: {
        PRIMARY: '#0F0F0F',
        SECONDARY: '#1A1A1A',
        TERTIARY: '#262626',
      },
      BORDER: {
        DEFAULT: '#374151',
        LIGHT: '#1F2937',
        FOCUS: '#6B21A8',
      },
      TEXT: {
        PRIMARY: '#FFFFFF',
        SECONDARY: '#9CA3AF',
        MUTED: '#6B7280',
      },
    },
  },
  
  // Animation configuration
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 200,
      SLOW: 300,
    },
    EASING: {
      DEFAULT: 'ease-in-out',
      SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
      BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Layout configuration
  LAYOUT: {
    MAX_WIDTH: {
      CONTENT: '1280px',
      NARROW: '768px',
      WIDE: '1536px',
    },
    SIDEBAR: {
      WIDTH: '240px',
      COLLAPSED_WIDTH: '64px',
    },
    HEADER: {
      HEIGHT: '64px',
    },
    SPACING: {
      XS: '0.25rem',
      SM: '0.5rem',
      MD: '1rem',
      LG: '1.5rem',
      XL: '2rem',
      XXL: '3rem',
    },
  },
  
  // Component defaults
  COMPONENTS: {
    BUTTON: {
      MIN_WIDTH: '80px',
      HEIGHT: {
        SM: '32px',
        MD: '40px',
        LG: '48px',
      },
    },
    INPUT: {
      HEIGHT: {
        SM: '32px',
        MD: '40px',
        LG: '48px',
      },
    },
    CARD: {
      BORDER_RADIUS: '0.75rem',
      SHADOW: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    MODAL: {
      MAX_WIDTH: {
        SM: '400px',
        MD: '600px',
        LG: '800px',
        XL: '1000px',
      },
    },
    TOAST: {
      MAX_WIDTH: '400px',
      POSITION: {
        TOP: '1rem',
        RIGHT: '1rem',
      },
    },
  },
  
  // Chart configuration
  CHARTS: {
    HEIGHT: {
      SM: 200,
      MD: 300,
      LG: 400,
      XL: 500,
    },
    MARGIN: {
      TOP: 20,
      RIGHT: 30,
      BOTTOM: 40,
      LEFT: 60,
    },
    AXIS: {
      FONT_SIZE: 12,
      TICK_SIZE: 5,
      COLOR: '#6B7280',
    },
    GRID: {
      COLOR: '#374151',
      OPACITY: 0.5,
      STROKE_DASHARRAY: '3 3',
    },
    TOOLTIP: {
      BACKGROUND: '#1F2937',
      BORDER: '#374151',
      TEXT_COLOR: '#FFFFFF',
      PADDING: 12,
    },
  },
  
  // Breakpoints
  BREAKPOINTS: {
    XS: '475px',
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    XXL: '1536px',
  },
  
  // Z-index scale
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
    NOTIFICATION: 1090,
  },
} as const;

// Helper functions
export const getThemeColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = UI_CONFIG.THEME.COLORS;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Theme color not found: ${path}`);
      return '#000000';
    }
  }
  
  return value as string;
};

export const getBreakpoint = (size: keyof typeof UI_CONFIG.BREAKPOINTS): string => {
  return UI_CONFIG.BREAKPOINTS[size];
};

export const isAboveBreakpoint = (windowWidth: number, breakpoint: keyof typeof UI_CONFIG.BREAKPOINTS): boolean => {
  const breakpointValue = parseInt(UI_CONFIG.BREAKPOINTS[breakpoint]);
  return windowWidth >= breakpointValue;
};