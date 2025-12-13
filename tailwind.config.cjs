/** @type {import('tailwindcss').Config} */
/* eslint-env node */

/**
 * Tailwind CSS Configuration
 *
 * Color Palette - Research-backed for Trust & Usability
 * Based on fintech/finance UX best practices:
 * - Blue conveys trust, reliability, security (dominant in finance)
 * - Green represents growth, success, positive outcomes
 * - All colors meet WCAG AA contrast requirements (4.5:1 for text)
 */
module.exports = {
  content: [
    './popup/**/*.{html,js}',
    './content/**/*.js',
    './background/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue - Trust & Reliability
        // Blue is the #1 trust color in finance/fintech UX
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main brand color
          600: '#2563eb', // Buttons, CTAs
          700: '#1d4ed8', // Hover states
          800: '#1e40af',
          900: '#1e3a8a'
        },
        // Secondary Purple - Premium Features
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9'
        },
        // Success Green - Growth & Positive Outcomes
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857'
        },
        // Warning Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        },
        // Error Red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      // Enhanced shadows for modern card designs
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover':
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px rgb(59 130 246 / 0.3)'
      },
      // Animation timing for micro-interactions
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms'
      }
    }
  },
  plugins: []
};
