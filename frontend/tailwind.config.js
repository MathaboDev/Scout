/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101014",
        "ink-soft": "#1B1B20",
        "ink-line": "#2B2B30",
        cream: "#F3F3F1", // app page background (neutral, matches landing)
        lime: "#E9E9E6", // neutral chip/badge fill inside the app
        neon: "#D7FF3D", // landing page yellow-green
        brand: "#E16041", // Scout logo orange
        "lime-ink": "#101014", // links + accents inside the app: black, like the landing buttons
        muted: "#6B6B6B",
        line: "#E5E5E2",
        amber: "#F2A93B",
        "amber-bg": "#FCEFDA",
        green: "#5FA84E",
        "green-bg": "#E7F4E1",
        "gray-bg": "#EEEEEC",
        rust: "#C24A3A",
      },
      fontFamily: {
        display: ["Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl2: "14px",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: 0.35, transform: "scale(0.85)" },
          "50%": { opacity: 1, transform: "scale(1.15)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        sweep: "sweep 7s linear infinite",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        marquee: "marquee 26s linear infinite",
        rise: "rise 0.6s ease both",
      },
    },
  },
  plugins: [],
};
