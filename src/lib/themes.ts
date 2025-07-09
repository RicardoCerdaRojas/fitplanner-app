export const themes = [
    {
        id: 'slate-mint',
        name: 'Slate & Mint',
        description: 'Calm, focused, and modern, with a fresh accent.',
        colors: {
            background: '0 0% 100%',
            foreground: '224 71% 4%',
            card: '220 13% 98%',
            primary: '221 39% 28%',
            'primary-foreground': '160 76% 97%',
            accent: '160 76% 59%',
            'accent-foreground': '221 39% 28%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '160 76% 59%',
        },
    },
    {
        id: 'ebony-gold',
        name: 'Ebony & Gold',
        description: 'Elegant and powerful, for a premium, exclusive feel.',
        colors: {
            background: '40 33% 97%',
            foreground: '240 10% 3.9%',
            card: '0 0% 100%',
            primary: '220 17% 20%',
            'primary-foreground': '45 86% 96%',
            accent: '45 86% 51%',
            'accent-foreground': '240 10% 3.9%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '45 86% 51%',
        },
    },
    {
        id: 'steel-amber',
        name: 'Steel & Amber',
        description: 'A dynamic and energetic theme for a modern club.',
        colors: {
            background: '210 40% 98%',
            foreground: '222 47% 11%',
            card: '0 0% 100%',
            primary: '215 39% 35%',
            'primary-foreground': '210 40% 98%',
            accent: '25 95% 53%',
            'accent-foreground': '0 0% 100%',
            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '25 95% 53%',
        },
    },
];

export type Theme = typeof themes[0];
export type ThemeColors = Theme['colors'];
