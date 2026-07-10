/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#C4B5FD",
        },
        background: "#FAFAFC",
        sidebar: "#F4F1FF",
        border: "#ECE8FF",
        text: "#111827",
        secondary: "#6B7280",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        inter: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        button: "12px",
        "button-sm": "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover":
          "0 8px 30px rgba(139,92,246,0.08), 0 2px 8px rgba(139,92,246,0.04)",
        "card-dark": "0 1px 3px rgba(0,0,0,0.2)",
        "btn-primary": "0 4px 12px rgba(139,92,246,0.3)",
        focus: "0 0 0 3px rgba(139,92,246,0.1)",
        modal: "0 8px 32px rgba(0,0,0,0.08)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in-right": "slideInRight 0.4s ease forwards",
        "scale-in": "scaleIn 0.3s ease forwards",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 2s linear infinite",
        "pulse-ring": "pulse-ring 2s infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "50%": { transform: "scale(1)", opacity: "0.3" },
          "100%": { transform: "scale(1.05)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
