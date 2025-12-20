/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: ['custom-scrollbar'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'var(--primary-lighter, #f0fdf4)',
                    100: 'var(--primary-light, #dcfce7)',
                    500: 'var(--primary-color, #16a34a)',
                    600: 'var(--primary-dark, #15803d)',
                    700: 'var(--primary-darker, #166534)',
                },
                neutral: {
                    50: 'var(--neutral-50, #f8fafc)',
                    100: 'var(--neutral-100, #f1f5f9)',
                    200: 'var(--neutral-200, #e2e8f0)',
                    300: 'var(--neutral-300, #cbd5e1)',
                    400: 'var(--neutral-400, #94a3b8)',
                    500: 'var(--neutral-500, #64748b)',
                    600: 'var(--neutral-600, #475569)',
                    700: 'var(--neutral-700, #334155)',
                    800: 'var(--neutral-800, #1e293b)',
                    900: 'var(--neutral-900, #0f172a)',
                },
                success: {
                    50: 'var(--success-bg, #f0fdf4)',
                    100: 'var(--success-border, #dcfce4)',
                    500: 'var(--success-color, #22c55e)',
                    600: '#16a34a',
                    700: '#15803d',
                },
                warning: {
                    50: 'var(--warning-bg, #fffbeb)',
                    100: 'var(--warning-border, #fef3c7)',
                    500: 'var(--warning-color, #f59e0b)',
                    600: '#d97706',
                    700: '#b45309',
                },
                danger: {
                    50: 'var(--danger-bg, #fef2f2)',
                    100: 'var(--danger-border, #fee2e2)',
                    500: 'var(--danger-color, #ef4444)',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
                info: {
                    50: 'var(--info-bg, #eff6ff)',
                    100: 'var(--info-border, #dbeafe)',
                    500: 'var(--info-color, #3b82f6)',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                accent: {
                    indigo: 'var(--accent-indigo, #6366f1)',
                    pink: 'var(--accent-pink, #ec4899)',
                    emerald: 'var(--accent-emerald, #10b981)',
                    orange: 'var(--accent-orange, #f97316)',
                    cyan: 'var(--accent-cyan, #06b6d4)',
                    violet: 'var(--accent-violet, #8b5cf6)',
                    amber: 'var(--accent-amber, #f59e0b)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }
        },
    },
    plugins: [],
}
