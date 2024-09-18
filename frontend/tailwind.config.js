/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mona: ["MonaSans"],
      },
      colors: {
        "uoa-blue": "#035084",
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
