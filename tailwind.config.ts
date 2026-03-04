import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Sea & Sand Theme - Teal & Gold
                primary: {
                    DEFAULT: "#134e4a", // Deep Teal (teal-900) — Brand
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#F59E0B", // Vibrant Amber (amber-500) — Action/Warmth
                    foreground: "#ffffff",
                },
                accent: {
                    DEFAULT: "#f97316", // Sunset Orange (orange-500)
                    foreground: "#ffffff",
                },
                sand: "#F5F0E8", // Warm sand — backgrounds only
                background: "#ffffff",
                foreground: "#1e293b",
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#1e293b",
                },
                popover: {
                    DEFAULT: "#ffffff",
                    foreground: "#1e293b",
                },
                muted: {
                    DEFAULT: "#f1f5f9",
                    foreground: "#64748b",
                },
                destructive: {
                    DEFAULT: "#ef4444",
                    foreground: "#ffffff",
                },
                border: "#e2e8f0",
                input: "#e2e8f0",
                ring: "#134e4a",
            },
            borderRadius: {
                lg: "0.75rem",  // 12px
                md: "0.625rem", // 10px
                sm: "0.5rem",   // 8px
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Circular", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
