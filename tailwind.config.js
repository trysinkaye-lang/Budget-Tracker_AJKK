/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#142321',
        muted: '#62716e',
        canvas: '#f3f6f5',
        brand: {
          50: '#ecfdf9',
          100: '#d1faef',
          500: '#159981',
          600: '#0f806e',
          700: '#0f685b',
          900: '#11433d'
        },
        coral: {
          50: '#fff4f1',
          500: '#ee775c',
          600: '#dc6045'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 35, 31, 0.04), 0 8px 30px rgba(15, 35, 31, 0.05)',
        float: '0 20px 55px rgba(15, 35, 31, 0.18)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
};
