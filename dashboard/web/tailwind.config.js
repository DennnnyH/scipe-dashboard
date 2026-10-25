/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        uh: {
          green: "#024731",
          "green-light": "#036B4A",
          "green-dark": "#013322",
          gold: "#C5B783",
          "gold-bright": "#E8D4A8",
          sand: "#F4F1EA",
          slate: "#1E293B",
        },
        status: {
          green: "#2D6A4F",
          yellow: "#B8860B",
          red: "#9B2335",
        },
      },
      fontFamily: {
        /* Matches conifer.build: UI + display + mono */
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          '"Inter Tight"',
          '"Plus Jakarta Sans"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(2, 71, 49, 0.08), 0 4px 12px rgba(2, 71, 49, 0.06)",
      },
    },
  },
  plugins: [],
};
