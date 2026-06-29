/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Superficies — fondo de app tipo fintech moderna (Mercury/Copilot Money)
        base: {
          DEFAULT: '#0B0E14',
          surface: '#12151C',
          elevated: '#1A1E27',
          border: '#262B36',
        },
        // Texto
        ink: {
          DEFAULT: '#F5F6F8',
          muted: '#9AA1AE',
          faint: '#5C6270',
        },
        // Acentos semánticos — usar para estado financiero, no decoración
        accent: {
          positive: '#34D399',   // saldo positivo, ahorro, salud buena
          negative: '#F87171',   // deuda, alerta, gasto excesivo
          warning: '#FBBF24',    // riesgo moderado, próximos vencimientos
          info: '#60A5FA',       // informativo, neutral
          brand: '#8B5CF6',      // acento de marca / IA
        },
      },
      borderRadius: {
        card: '20px',
      },
      fontSize: {
        'amount-lg': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'amount-md': ['1.5rem', { lineHeight: '1.875rem', fontWeight: '700' }],
        'amount-sm': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
