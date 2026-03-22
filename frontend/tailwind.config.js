/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        tmc: '#20B2AA', // TMC green
        bjp: '#FF6B00', // BJP orange
        cpm: '#DC2626', // CPM red
        inc: '#1E40AF', // INC blue
        isf: '#7C3AED', // ISF purple
        ind: '#6B7280'  // Independent gray
      }
    }
  },
  plugins: [],
}
