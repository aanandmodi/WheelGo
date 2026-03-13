module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // Royal Blue
          light: "#60A5FA",
          dark: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#F59E0B", // Amber
          light: "#FCD34D",
          dark: "#B45309",
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
