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
        "primary": "#c0c1ff",
        "primary-container": "#8083ff",
        "on-primary": "#1000a9",
        "on-primary-container": "#0d0096",
        "primary-fixed": "#e1e0ff",
        "primary-fixed-dim": "#c0c1ff",
        
        "secondary": "#c3c6cf",
        "secondary-container": "#454950",
        "on-secondary": "#2d3137",
        "on-secondary-container": "#b5b8c1",
        
        "tertiary": "#ffb783",
        "tertiary-container": "#d97721",
        "on-tertiary": "#4f2500",
        "on-tertiary-container": "#452000",
        
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        
        "background": "#091421",
        "on-background": "#d9e3f6",
        "surface": "#091421",
        "surface-dim": "#091421",
        "surface-bright": "#303a48",
        "surface-variant": "#2b3544",
        "on-surface": "#d9e3f6",
        "on-surface-variant": "#c7c4d7",
        
        "surface-container-lowest": "#050f1c",
        "surface-container-low": "#121c2a",
        "surface-container": "#16202e",
        "surface-container-high": "#212b39",
        "surface-container-highest": "#2b3544",
        
        "outline": "#908fa0",
        "outline-variant": "#464554",
        "inverse-surface": "#d9e3f6",
        "inverse-on-surface": "#27313f",
        "inverse-primary": "#494bd6",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        "xs": "8px",
        "sm": "12px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "2xl": "48px",
        "base": "4px",
        "gutter": "24px",
        "container-max": "1200px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
