module.exports = {
    content: [
        "./frontend/**/*.{html,js}",
        "./frontend/src/**/*.{js,jsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#0969da',
                secondary: '#6e7781',
                dark: {
                    '900': '#15171a',
                    '800': '#1a1d21',
                    '700': '#22262b',
                    '600': '#2b3038',
                    '500': '#363b44',
                    'border': 'rgba(75, 85, 99, 0.15)'
                }
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        }
    },
    plugins: [
        require('@tailwindcss/typography')
    ]
}; 