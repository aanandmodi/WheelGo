module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EA580C", // Orange 600
          light: "#FB923C",   // Orange 400
          dark: "#C2410C",    // Orange 700
        },
        secondary: {
          DEFAULT: "#0F172A", // Slate 900 / Deep Navy
          light: "#1E293B",   // Slate 800
          dark: "#020617",    // Slate 950
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
