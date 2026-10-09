/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F4F7FB',
          100: '#E4EAF3',
          400: '#8B97AB',
          700: '#2A3140',
          900: '#0B0E14',
          950: '#07090D'
        },
        aqua: '#7CFFF2',
        lilac: '#C9A8FF',
        rose: '#FFB4E0'
      },
      fontFamily: {
        sans: [
          'Segoe UI Variable',
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'Cascadia Code',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(255,255,255,0.22)',
        glow: 'none'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
