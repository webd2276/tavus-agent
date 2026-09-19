/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zain: {
          base: "#0F1417", deep: "#0A0F12", surface: "#171C1F",
          panel: "#1B2023", raised: "#262B2E", line: "#414843",
          ink: "#DFE3E7", muted: "#C1C8C1", sage: "#7FA890",
          sageLight: "#A6D0B7", sageDark: "#163D2B", danger: "#FFB4AB",
          dangerSurface: "#93000A", bright: "#353A3D",
        },
      },
      fontFamily: { display: ["var(--font-display)", "sans-serif"], body: ["var(--font-body)", "sans-serif"], mono: ["var(--font-mono)", "monospace"] },
      boxShadow: { glass: "0 20px 40px -18px rgba(0,0,0,.65)", glow: "0 8px 24px -8px rgba(127,168,144,.45)" },
    },
  },
  plugins: [],
};
