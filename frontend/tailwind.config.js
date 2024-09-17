/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: [
      {
        VPSTheme: {
          "primary": "#fafafa",
          "secondary": "#0080a7",
        },
      },
    ],
  },
};
