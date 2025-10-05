    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {
            aspectRatio: {
                '4/3': '4 / 3',
            },
            fontFamily: {
                'display': ['"Playfair Display"', 'serif'],
                'body': ['"Lora"', 'serif'],
            }
        },
      },
      plugins: [
        require('@tailwindcss/aspect-ratio'),
      ],
    }
    