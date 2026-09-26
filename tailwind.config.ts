import type { Config } from "tailwindcss";

/**
 * I colori non sono valori fissi ma puntano ai token definiti in
 * `src/app/globals.css`, dove il tema chiaro e quello scuro ridefiniscono le
 * stesse variabili. Ogni voce usa la forma `rgb(var(--x) / <alpha-value>)`
 * cosi Tailwind puo continuare ad applicare l opacita (`bg-white/5`).
 *
 * Le famiglie mantengono i nomi storici (venrix, ink, slate, white) perche
 * sono gia scritte in centinaia di punti nei componenti: cambiando qui la
 * destinazione, tutto il sito segue il tema senza toccare quei file.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  // Il tema non passa da una classe `dark` ma dall attributo data-theme
  // sull elemento html, come su ninfea.fun.
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Il colore che "spicca" sul fondo: bianco nel tema scuro, quasi nero
        // nel tema chiaro. Rende validi text-white, bg-white/5, border-white/10.
        white: token("--c-contrast"),
        // Testo che sta sopra un fondo brand e resta bianco in ogni tema.
        onbrand: token("--c-onbrand"),

        venrix: {
          50: token("--c-tint"),
          100: token("--c-accent"),
          200: token("--c-accent"),
          300: token("--c-accent"),
          400: token("--c-brand-light"),
          500: token("--c-brand"),
          600: token("--c-brand"),
          700: token("--c-brand-700"),
          800: token("--c-brand-800"),
          900: "#5c0b54",
          950: "#3a0a35",
        },

        // Fondali, dal piu profondo alla superficie sollevata.
        ink: {
          900: token("--c-bg-deep"),
          800: token("--c-bg"),
          700: token("--c-surface"),
          600: token("--c-surface-2"),
        },

        // Scala di testo: i componenti usano solo 100..500, le tinte piu scure
        // restano definite per non rompere eventuali usi futuri.
        slate: {
          50: token("--c-text"),
          100: token("--c-text"),
          200: token("--c-text"),
          300: token("--c-text-dim"),
          400: token("--c-text-mute"),
          500: token("--c-text-mute"),
          600: token("--c-text-mute"),
          700: token("--c-surface-2"),
          800: token("--c-surface"),
          900: token("--c-bg"),
          950: token("--c-bg-deep"),
        },
      },
      backgroundImage: {
        // Due macchie sfalsate, non un cerchio centrato: la luce deve
        // sembrare arrivare da un punto preciso fuori campo.
        "venrix-radial":
          "radial-gradient(48% 42% at 24% 0%, rgb(var(--c-brand) / 0.2), transparent 70%), radial-gradient(40% 38% at 84% 18%, rgb(var(--c-brand-light) / 0.12), transparent 74%)",
        "venrix-brand": "linear-gradient(120deg, rgb(var(--c-brand-light)), rgb(var(--c-brand)))",
      },
      boxShadow: {
        // `glow` e' l'alone diffuso attorno al logo; le altre sono le
        // ombre morbide del sistema, gia' tinte del colore del fondo.
        glow: "0 0 48px rgb(var(--c-brand) / 0.3)",
        card: "var(--shadow-md)",
        lift: "var(--shadow-lift)",
        sm: "var(--shadow-sm)",
        brand: "var(--shadow-brand)",
        sheen: "var(--sheen)",
      },
      /*
       * Una sola scala di raggi per tutto il sito (vedi globals.css):
       * pastiglia, elemento interno, contenitore, superficie grande. I nomi
       * restano quelli di Tailwind perche' sono scritti in centinaia di
       * punti nei componenti: cambia solo il valore a cui puntano.
       */
      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-sm)",
        md: "var(--radius-sm)",
        lg: "var(--radius)",
        xl: "var(--radius)",
        "2xl": "var(--radius-lg)",
        "3xl": "var(--radius-lg)",
        full: "var(--radius-pill)",
      },
      maxWidth: {
        "7xl": "1280px",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        // I dati (IP, versione, conteggi, ID) vanno in monospaziato: li
        // distingue dal testo redazionale e tiene le cifre incolonnate.
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
