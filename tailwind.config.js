/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        archive: {
          950: '#06080b',
          900: '#0a0d12',
          850: '#0f141b',
          800: '#141b24',
          700: '#1e2836',
          600: '#2b394d',
          500: '#475b75',
          muted: '#8f9ea2',
          paper: '#eae6dc',
          parchment: '#f5f2e9',
        },
        turing: {
          amber: '#f59e0b',
          green: '#10b981',
          red: '#e11d48',
          cyan: '#06b6d4',
          gold: '#d97706',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'tape-scroll': 'tape 20s linear infinite',
      },
      keyframes: {
        tape: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
