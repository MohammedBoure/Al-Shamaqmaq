/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: '#0D0D19',
          card: '#16162C',
          cardHover: '#1F1F3D',
          border: '#2E2E5A',
          purple: '#8B5CF6',
          pink: '#EC4899',
          cyan: '#06B6D4',
          yellow: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Readex Pro', 'Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px -3px rgba(139, 92, 246, 0.45)',
        'neon-pink': '0 0 20px -3px rgba(236, 72, 153, 0.45)',
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'neon-yellow': '0 0 20px -3px rgba(245, 158, 11, 0.45)',
        'neon-green': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-3%)' },
          '50%': { transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-3px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(3px, 0, 0)' },
        },
        glow: {
          '0%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(236, 72, 153, 0.8))' },
        },
      },
    },
  },
  plugins: [],
};
