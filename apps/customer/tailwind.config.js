module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F766E", // Teal 700
          light: "#14B8A6",   // Teal 500
          dark: "#115E59",    // Teal 800
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F59E0B", // Amber 500
          light: "#FCD34D",   // Amber 300
          dark: "#B45309",    // Amber 700
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
