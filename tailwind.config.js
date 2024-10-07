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
        myCustomTheme: {
          primary: "#a991f7",
          secondary: "#f6d860",
          accent: "#37cdbe",
          neutral: "#3d4451",
          "base-100": "#ffffff",
        },
      },
    ],
  },
};
