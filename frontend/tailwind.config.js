/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0f1623',
          hover: '#1a2235',
          active: '#1e2d4a',
          border: '#1e2d45',
        },
        card: '#111827',
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          light: '#60a5fa',
        },
        surface: '#1f2937',
        'surface-2': '#374151',
      },
    },
  },
  plugins: [],
}
