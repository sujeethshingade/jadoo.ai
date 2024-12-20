import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
    	container: {
    		center: true,
    		padding: {
    			DEFAULT: '1rem',
    			md: '2rem',
    			lg: '4rem'
    		}
    	},
    	extend: {
    		animation: {
    			'move-left': 'move-left 1s linear infinite',
    			'move-right': 'move-right 1s linear infinite'
    		},
    		keyframes: {
    			'move-left': {
    				'0%': {
    					transform: 'translateX(0%)'
    				},
    				'100%': {
    					transform: 'translateX(-50%)'
    				}
    			},
    			'move-right': {
    				'0%': {
    					transform: 'translateX(-50%)'
    				},
    				'100%': {
    					transform: 'translateX(0%)'
    				}
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {}
    	},
    	fontFamily: {
    		sans: [
    			'var(--font-inter)',
    			'sans-serif'
    		]
    	},
    	screens: {
    		sm: '375px',
    		md: '768px',
    		lg: '1200px'
    	}
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
