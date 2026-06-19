import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'luxury-gold': {
          DEFAULT: '#D4AF37',
          light: '#E8C84B',
          dark: '#B8941F',
        },
        'deep-black': '#050505',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #F5D475 50%, #B8941F 100%)",
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      boxShadow: {
        'gold': '0 0 30px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 0 60px rgba(212, 175, 55, 0.4)',
        'luxury': '0 40px 80px -20px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slow-zoom': 'slowZoom 20s ease-in-out infinite alternate',
        'glow': 'glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
