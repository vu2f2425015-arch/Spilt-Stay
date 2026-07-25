/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#818cf8",
        "primary-container": "#6366f1",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        
        "secondary": "#a7f3d0",
        "secondary-container": "#10b981",
        "on-secondary": "#064e3b",
        "on-secondary-container": "#ecfdf5",
        
        "tertiary": "#fde047",
        "tertiary-container": "#eab308",
        "on-tertiary": "#422006",
        "on-tertiary-container": "#fefce8",
        
        "error": "#f87171",
        "error-container": "#ef4444",
        "on-error": "#ffffff",
        "on-error-container": "#fef2f2",
        
        "background": "#0b0f19",
        "on-background": "#f1f5f9",
        "surface": "#111827",
        "surface-dim": "#0b0f19",
        "surface-bright": "#1f2937",
        "surface-variant": "#1f2937",
        "on-surface": "#f8fafc",
        "on-surface-variant": "#94a3b8",
        
        "surface-container-lowest": "#050811",
        "surface-container-low": "#0f172a",
        "surface-container": "#1e293b",
        "surface-container-high": "#334155",
        "surface-container-highest": "#475569",
        
        "outline": "#64748b",
        "outline-variant": "#334155",
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1.25rem",
        "2xl": "1.75rem",
        "full": "9999px"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 25px rgba(99, 102, 241, 0.7)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
