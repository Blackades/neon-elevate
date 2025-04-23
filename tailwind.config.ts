import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        'cyber-black': '#0d0d0d',
        'cyber-dark': '#1a1a1a',
        'cyber-blue': 'var(--cyber-blue, #00F0FF)',
        'cyber-pink': 'var(--cyber-pink, #FF0055)',
        'cyber-yellow': 'var(--cyber-yellow, #FFE81F)',
        'cyber-purple': 'var(--cyber-purple, #9B87F5)',
        'cyber-green': 'var(--cyber-green, #00FF66)',
        'neon-pink': '#FF0055',
        'neon-yellow': '#FFE81F',
        'neon-blue': '#00F0FF',
        'neon-purple': '#9B87F5',
        'neon-green': '#00FF66',
        'neon-orange': '#FF6B00',
        'neon-violet': '#8B00FF',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'digital-rain': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '5%': { opacity: '0.5' },
          '95%': { opacity: '0.5' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' }
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px #00F0FF, 0 0 10px #00F0FF, 0 0 15px #00F0FF' },
          '50%': { boxShadow: '0 0 20px #00F0FF, 0 0 30px #00F0FF, 0 0 40px #00F0FF' }
        },
        'scale': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'digital-rain': 'digital-rain 5s linear infinite',
        'glitch': 'glitch 0.5s infinite',
        'pulse-neon': 'pulse-neon 2s infinite',
        'scale': 'scale 2s ease-in-out infinite'
      },
      fontFamily: {
        'cyber': ['Orbitron', 'sans-serif'],
        'cyber-mono': ['Share Tech Mono', 'monospace']
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00F0FF, 0 0 10px #00F0FF, 0 0 15px #00F0FF',
        'neon-pink': '0 0 5px #FF0055, 0 0 10px #FF0055, 0 0 15px #FF0055',
        'neon-yellow': '0 0 5px #F5EB41, 0 0 10px #F5EB41, 0 0 15px #F5EB41',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
