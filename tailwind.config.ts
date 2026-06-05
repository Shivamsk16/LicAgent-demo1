import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lic: {
          yellow: {
            50: "#FFFDF0",
            100: "#FFF9E6",
            400: "#F5C842",
            700: "#B8941E",
          },
          blue: {
            50: "#EAF4FB",
            400: "#4A90D9",
            700: "#185FA5",
          },
          neutral: {
            50: "#F7F7F5",
            200: "#E8E6DE",
            500: "#888780",
            800: "#3D3D3A",
          },
          green: { 100: "#EAF3DE", 600: "#3B6D11" },
          amber: { 100: "#FAEEDA", 600: "#BA7517" },
          red: { 100: "#FCEBEB", 600: "#A32D2D" },
        },
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        badge: "20px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
