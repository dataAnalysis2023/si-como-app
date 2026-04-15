/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mantel: '#F5EBDD',
        mantelDark: '#E8D8BF',
        terracota: '#C46B4A',
        terracotaDark: '#A85337',
        crema: '#FAF4EA',
        tinta: '#3B2A1E',
        tintaSuave: '#6B5744',
        cubierto: '#8A6B4E',
        platoBorde: '#D9C3A1',
        platoFondo: '#FFFDF8',
        exito: '#6FA26B',
        alerta: '#C45A4A',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        plato: '0 20px 60px -20px rgba(59,42,30,0.35), 0 8px 20px -8px rgba(59,42,30,0.2)',
      },
    },
  },
  plugins: [],
};
