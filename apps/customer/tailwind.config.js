module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EA580C", // Orange 600
          light: "#FB923C",   // Orange 400
          dark: "#C2410C",    // Orange 700
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0F172A", // Slate 900 / Deep Navy
          light: "#1E293B",   // Slate 800
          dark: "#020617",    // Slate 950
        },
        background: "#F8FAFC", // Slate 50
        surface: "#FFFFFF",
        text: {
          primary: "#0F172A",   // Slate 900
          secondary: "#64748B", // Slate 500
          muted: "#94A3B8",     // Slate 400
        },
        border: "#E2E8F0",      // Slate 200
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}
