/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#22c55e',
        surface: '#ffffff',
        background: '#f8fafc',
        card: '#f1f5f9',
        subtext: '#64748b',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
