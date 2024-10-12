module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}', 
    './.storybook/**/*.{js,jsx,ts,tsx}', 
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#1e40af",
          secondary: "#1e40af",
          accent: "#1e40af",
          neutral: "#1e40af",
          "base-100": "#2563eb",
          info: "#bae6fd",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
  },
};