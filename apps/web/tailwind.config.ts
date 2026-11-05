import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        merah: {
          DEFAULT: "#C8102E",
          gelap: "#8F0A20",
          lebihGelap: "#5E0615",
        },
        emas: {
          DEFAULT: "#D4A017",
          terang: "#F2C94C",
          gelap: "#9A7208",
        },
        krem: "#FAF6EF",
        gelap: "#1A1A1A",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        kartu: "0 18px 50px -24px rgba(94, 6, 21, 0.35)",
      },
      backgroundImage: {
        "panggung":
          "radial-gradient(circle at 50% 0%, #A20C25 0%, #6D0819 48%, #3A0410 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 160, 23, 0.28)" },
          "50%": { boxShadow: "0 0 0 10px rgba(212, 160, 23, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 500ms ease-out both",
        glow: "glow 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
