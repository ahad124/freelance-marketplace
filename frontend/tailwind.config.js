/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base / surfaces (layered dark elevation)
        ink: { DEFAULT: '#080B14', 900: '#0A0E1A', 800: '#0E131F' },
        surface: '#111725',
        'surface-2': '#151C2C',
        elevated: '#1A2334',
        line: 'rgba(255,255,255,0.08)',
        'line-strong': 'rgba(255,255,255,0.14)',
        // Brand (indigo → violet)
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#5b54e6', 700: '#4a45c9',
          800: '#3b389f', 900: '#2f2d7c',
        },
        accent: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.7)',
        elevated: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px -20px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(99,102,241,0.35), 0 14px 40px -12px rgba(99,102,241,0.5)',
        'glow-sm': '0 8px 24px -10px rgba(99,102,241,0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(99,102,241,0.16), rgba(168,85,247,0.10))',
        'sheen': 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.14) 50%, transparent 80%)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-glow': { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
      },
    },
  },
  plugins: [],
};
