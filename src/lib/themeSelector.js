'use strict';

export default {
    themes: {
        light: { label: 'Light', icon: 'sun-fill' },
        dark: { label: 'Dark', icon: 'moon-stars-fill' },
        auto: { label: 'Auto', icon: 'circle-half' },
    },

    setTheme (theme) {
        if (theme === 'auto') {
            document.documentElement.setAttribute('data-bs-theme', this.getPreferredTheme());
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
    },

    getPreferredTheme () {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    watchPreferredColorScheme (getStoredTheme) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const storedTheme = getStoredTheme();
            if (storedTheme !== 'light' && storedTheme !== 'dark') {
                this.setTheme(this.getPreferredTheme());
            }
        });
    },
};
