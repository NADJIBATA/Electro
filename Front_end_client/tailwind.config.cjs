/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
        cond: ['"Barlow Semi Condensed"', "Barlow", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#1b9602", deep: "#146f02", soft: "#e7f3e3" },
        ink: { DEFAULT: "#17211a", muted: "#5b675e" },
        paper: "#f4f6f4",
        steel: { DEFAULT: "#dde3de", dark: "#b9c3bb" },
        star: { DEFAULT: "#f5c400", soft: "#fff6cc" },
        danger: "#b42318",
      },
      maxWidth: { shop: "80rem" },
    },
  },
  plugins: [],
};
