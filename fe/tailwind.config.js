
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neo: {
                    red: '#FF6B6B',
                    teal: '#4ECDC4',
                    yellow: '#FFE66D',
                    dark: '#1A535C',
                    white: '#F7FFF7',
                }
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px #000000',
                'neo-hover': '2px 2px 0px 0px #000000',
                'neo-sm': '2px 2px 0px 0px #000000',
            },
            borderRadius: {
                'neo': '0px', // Strict sharp corners often work well, or keep small radius
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
