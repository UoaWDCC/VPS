/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mona: ["MonaSans"],
      },
    },
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: [
      {
        VPSTheme: {
          primary: "#fafafa",
          secondary: "#0080a7",
        },
      },
      "emerald",
    ],
  },
};
