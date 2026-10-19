/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#090c11',
          900: '#0f131a',
          850: '#151a23',
          800: '#1b2130',
          750: '#202738',
          700: '#242c3a',
          600: '#303a4b',
        },
        ai: {
          violet: '#8a78ff',
          blue: '#5e9dff',
        },
        semantic: {
          success: '#55d79b',
          warning: '#f0bb62',
          danger: '#ff6d75',
          info: '#62a0ff',
          neutral: '#8b95a7',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
