/** Design tokens de Figma (modo claro): tipografia, escala de tamaños y paletas green + zinc. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      maxWidth: { page: '1480px', reviews: '1360px' },
      fontFamily: {
        heading: ['"ES Klarheit Kurrent TRIAL"', 'Inter Variable', 'system-ui', 'sans-serif'],
        body: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      // typeface / Size (px): sm 10, md 12, lg 16, xl 20, 2xl 24, 3xl 32, 4xl 40, 5xl 48, 6xl 60
      fontSize: {
        xs: '10px', sm: '12px', base: '16px', lg: '16px', xl: '20px',
        '2xl': '24px', '3xl': '32px', '4xl': '40px', '5xl': '48px', '6xl': '60px',
      },
      colors: {
        green: {
          50: '#F2FDF8', 100: '#DBFAEC', 200: '#BCF5DC', 300: '#90EFC4', 400: '#63E9AC',
          500: '#36E295', 600: '#1DCA7C', 700: '#169C60', 800: '#106F44', 900: '#0A4329', 950: '#052416',
        },
        // Secondary: Purple Heart (Figma). Se usa para "me gusta" / favoritos.
        purple: {
          50: '#FAF2FD', 100: '#F1DBFA', 200: '#E5BCF6', 300: '#D48FEF', 400: '#C362E9',
          500: '#B236E3', 600: '#981CC9', 700: '#76169C', 800: '#541070', 900: '#330943', 950: '#1B0524',
        },
        zinc: {
          50: '#FAFAFA', 100: '#F4F4F5', 200: '#E4E4E7', 300: '#D4D4D8', 400: '#A1A1AA', 500: '#71717A',
          // En Figma el token "600*" vale 09090B (casi negro); 700-950 como en la hoja.
          600: '#09090B', 700: '#52525B', 800: '#3F3F46', 900: '#27272A', 950: '#18181B',
        },
      },
    },
  },
  plugins: [],
}
