// Mobile-First Design Tokens for Industrial Use

export const designTokens = {
    // Colors - High Contrast for Industrial Environments
    colors: {
        primary: {
            main: '#2563EB',      // Blue-600
            light: '#3B82F6',     // Blue-500
            dark: '#1E40AF',      // Blue-700
            contrast: '#FFFFFF'
        },
        success: {
            main: '#16A34A',      // Green-600
            light: '#22C55E',     // Green-500
            dark: '#15803D',      // Green-700
            contrast: '#FFFFFF'
        },
        warning: {
            main: '#EA580C',      // Orange-600
            light: '#F97316',     // Orange-500
            dark: '#C2410C',      // Orange-700
            contrast: '#FFFFFF'
        },
        danger: {
            main: '#DC2626',      // Red-600
            light: '#EF4444',     // Red-500
            dark: '#B91C1C',      // Red-700
            contrast: '#FFFFFF'
        },
        neutral: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A'
        }
    },

    // Typography - Optimized for Mobile Readability
    typography: {
        fontFamily: {
            sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',      // Minimum for mobile
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px'
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800
        },
        lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
        }
    },

    // Spacing - Touch-Friendly
    spacing: {
        touchTarget: {
            min: '48px',        // WCAG minimum
            comfortable: '56px', // Recommended for primary actions
            large: '64px'       // For critical actions
        },
        gap: {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px'
        },
        padding: {
            page: '16px',       // Mobile page padding
            card: '16px',       // Card internal padding
            section: '24px'     // Section spacing
        }
    },

    // Shadows - Subtle for Industrial
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },

    // Border Radius
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
    },

    // Z-Index Layers
    zIndex: {
        base: 0,
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modalBackdrop: 1040,
        modal: 1050,
        popover: 1060,
        tooltip: 1070
    },

    // Animation Durations
    animation: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms'
    }
};

export default designTokens;
