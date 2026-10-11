/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#27397d',
          accent: '#a7f99e',
          electric: '#27397d',
          sky: '#27397d',
          dark: '#1e2433',
          warmBg: '#fcfbf9',
          cream: '#f5f4f0',
          border: '#e8e6df'
        }
      },
      fontFamily: {
        sans: ['CodeMonoNumbers', 'Pretendard', 'Noto Sans KR', '-apple-system', 'sans-serif'],
        montserrat: ['CodeMonoNumbers', 'Montserrat', 'Pretendard', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Roboto Mono', 'monospace'],
        price: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Roboto Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
