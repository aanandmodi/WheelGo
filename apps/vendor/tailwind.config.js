module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F1115", // Carbon Black
          light: "#1F2937",   // Charcoal
          dark: "#000000",    // Jet Black
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFC72C", // Taxi Gold
          light: "#FFE382",   // Soft Gold
          dark: "#CA9900",    // Deep Gold
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: {
          primary: "#0F1115",
          secondary: "#4B5563",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",
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
