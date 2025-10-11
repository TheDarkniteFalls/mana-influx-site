/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: "#10B981",
        },
        slate: {
          900: "#0F172A",
          100: "#F1F5F9",
        },
        accent: {
          gold: "#EAB308",
        },
      },
      fontFamily: {
        serif: ["Merriweather", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
