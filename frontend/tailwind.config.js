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
        main: "#f8fafc",
      },
    },
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: [
      {
        VPSTheme: {
          ...require("daisyui/src/theming/themes")["emerald"],
          primary: "#fafafa",
          secondary: "#035084",
          error: "#c13216",
        },
      },
    ],
  },
};
