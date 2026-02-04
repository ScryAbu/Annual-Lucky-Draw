/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色科技主题
        'tech': {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          accent: '#22d3ee',
        },
        // 白色极简主题
        'minimal': {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          accent: '#0ea5e9',
        },
        // 红色过年主题
        'chinese': {
          primary: '#DC143C',
          secondary: '#FFD700',
          background: '#8B0000',
          surface: '#A52A2A',
          text: '#FFF8DC',
          accent: '#FFD700',
          gold: '#DAA520',
          darkRed: '#800000',
        }
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'tech-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        'chinese-gradient': 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
      }
    },
  },
  plugins: [],
}
