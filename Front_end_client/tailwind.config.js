/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        pcbackground: "url('./src/assets/pcbackground.jpg')",
      },
      colors: {
        "custom-green": "#1b9602 ",
        "custom-green1": "#32b312",
        "custom-white": "#eee",
        "custom-dark": "#333;",
      },
    },
  },
  plugins: [],
};
