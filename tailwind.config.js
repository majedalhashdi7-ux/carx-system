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
        'carx': {
          'primary': '#000000',
          'secondary': '#ff0000',
          'accent': '#cc0000',
          'background': '#111111',
          'text': '#ffffff',
          'gray': {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        },
        'cinematic': {
          'dark': '#0a0a0a',
          'darker': '#050505',
          'neon-blue': '#00f0ff',
          'neon-red': '#ff0040',
          'gold': '#ffd700',
        }
      },
      fontFamily: {
        'arabic': ['Tajawal', 'Inter', 'sans-serif'],
        'display': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'carx': '0 10px 30px rgba(255, 0, 0, 0.3)',
        'carx-lg': '0 20px 40px rgba(255, 0, 0, 0.4)',
        'neon': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-red': '0 0 20px rgba(255, 0, 64, 0.5)',
      },
      backgroundImage: {
        'gradient-carx': 'linear-gradient(135deg, #000000 0%, #330000 50%, #000000 100%)',
        'gradient-red': 'linear-gradient(135deg, #ff0000 0%, #cc0000 50%, #990000 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}