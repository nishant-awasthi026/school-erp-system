/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
        colors: {
            "primary": "#2444eb",
            "primary-container": "#8999ff",
            "on-primary": "#f3f1ff",
            "on-primary-container": "#001470",
            "secondary": "#652fe7",
            "secondary-container": "#d8caff",
            "on-secondary": "#f7f0ff",
            "on-secondary-container": "#5000d2",
            "tertiary": "#b41924",
            "tertiary-container": "#ff928c",
            "on-tertiary": "#ffefee",
            "on-tertiary-container": "#69000c",
            "background": "#f9f5ff",
            "on-background": "#2d2a51",
            "surface": "#f9f5ff",
            "on-surface": "#2d2a51",
            "surface-variant": "#ddd9ff",
            "on-surface-variant": "#5a5781",
            "surface-container-low": "#f3eeff",
            "surface-container": "#eae5ff",
            "surface-container-high": "#e3dfff",
            "surface-container-highest": "#ddd9ff",
            "surface-container-lowest": "#ffffff"
        },
        fontFamily: {
            "headline": ["Plus Jakarta Sans"],
            "body": ["Inter"],
            "label": ["Inter"]
        },
        borderRadius: {
            "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px"
        }
    }
  },
  plugins: [],
}
