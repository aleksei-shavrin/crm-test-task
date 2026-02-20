/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [],
  // Avoid conflicts with Vuetify's utility classes if needed
  corePlugins: {
    preflight: false
  }
}
