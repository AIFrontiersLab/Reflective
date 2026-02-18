/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fafafa",
          elevated: "#ffffff",
          overlay: "rgba(0,0,0,0.04)",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.08)",
          strong: "rgba(0,0,0,0.12)",
        },
        label: {
          primary: "#000000",
          secondary: "rgba(0,0,0,0.6)",
          tertiary: "rgba(0,0,0,0.4)",
        },
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "16px",
      },
    },
  },
  plugins: [],
};
