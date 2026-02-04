import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black900: "#05050a",
        black800: "#0b0b14",

        neonPink: "#ff2ec4",
        neonCyan: "#00eaff",
        neonGreen: "#2bff88",
        neonViolet: "#a84dff",
      },

      backgroundImage: {
        "grad-primary":
          "linear-gradient(135deg, #ff2ec4, #a84dff)",
        "grad-accent":
          "linear-gradient(135deg, #ff2ec4, #00eaff)",
      },

      boxShadow: {
        glass: "0 20px 50px rgba(0,0,0,0.5)",
        neon: "0 0 30px rgba(255,46,196,0.5)",
      },

      borderRadius: {
        xl: "24px",
        lg: "20px",
        md: "12px",
        pill: "999px",
      },

      fontSize: {
        micro: "12px",
        ui: "14px",
        hero: "96px",
      },

      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
} satisfies Config;
