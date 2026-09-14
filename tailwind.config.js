/** @type {import('tailwindcss').Config} */

/**
 *
 * Nine pages reference bg-recess, text-chalk, border-seam, bg-lamp and the rest.
 * Renaming them means editing every file before a single pixel can be judged, so
 * the names stay and the values change. `recess` still means "the furthest back
 * surface" — it just happens to be void now instead of dark green. When the
 * reskin is settled the vocabulary can be renamed in one pass, or left alone.
 *
 * Two values shift meaning and are worth reading twice:
 *   lamp  was signal yellow on a chalkboard. It is now signal rose, and it is
 *         reserved: one lamp-coloured control per screen, and it is the thing
 *         the person came to do.
 *   lip   was the bright chalk edge under a slot. In void there is no chalk, so
 *         it is now the lit hairline that separates a raised plate from its
 *         surroundings.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    boxShadow: {
      none: 'none',
      // A plate catches a little light on its top edge and loses it at the base.
      slot: 'inset 0 1px 0 0 rgba(255,255,255,0.045)',
      lip: 'inset 0 -1px 0 0 rgba(255,255,255,0.035)',
      lifted: '0 0 0 1px #23232E, 0 24px 48px -16px rgba(0,0,0,0.85)',
      ring: '0 0 0 2px #050507, 0 0 0 4px #FF2E55',
      // The primary control is a ring of light around empty space.
      glow: '0 0 22px rgba(255,46,85,0.20), inset 0 0 22px rgba(255,46,85,0.10)',
      'glow-lg': '0 0 36px rgba(255,46,85,0.36), inset 0 0 26px rgba(255,46,85,0.16)',
      'glow-danger': '0 0 24px rgba(255,92,56,0.28)',
    },
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        // Apple Design System (DESIGN.md)
        primary:          '#0066cc', // Action Blue
        'primary-focus':  '#0071e3', // Focus Blue
        'primary-on-dark':'#2997ff', // Sky Link Blue
        
        ink:              '#1d1d1f', // Near-Black Ink
        body:             '#1d1d1f', // Body copy
        'body-on-dark':   '#ffffff',
        'body-muted':     '#cccccc',
        'ink-muted-80':   '#333333',
        'ink-muted-48':   '#7a7a7a',

        canvas:           '#ffffff', // Pure white
        parchment:        '#f5f5f7', // Signature Apple off-white
        pearl:            '#fafafc', // Pearl button surface
        hairline:         '#e0e0e0', // 1px hairline border
        'divider-soft':   '#f0f0f0',

        'surface-tile-1': '#272729', // Near-Black Tile 1
        'surface-tile-2': '#2a2a2c',
        'surface-tile-3': '#252527',
        'surface-black':  '#000000', // Pure black (global nav)

        // Legacy semantic mappings mapped to Apple tokens
        recess:           '#f5f5f7',
        enamel:           '#ffffff',
        lit:              '#fafafc',
        seam:             '#e0e0e0',
        lip:              '#d2d2d7',
        chalk:            '#1d1d1f',
        muted:            '#7a7a7a',
        dim:              '#9a9a9a',
        lamp:             '#0066cc',
        ember:            '#0071e3',
        posted:           '#34c759', // Apple Green
        amber:            '#ff9500', // Apple Orange
        flare:            '#ff3b30', // Apple Red
      },
      boxShadow: {
        none: 'none',
        // Apple's signature single drop-shadow reserved for imagery/elevated surfaces
        'apple-product': '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Martian Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero-display': ['56px', { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
        'display-lg':   ['40px', { lineHeight: '1.10', letterSpacing: '0px', fontWeight: '600' }],
        'display-md':   ['34px', { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '600' }],
        lead:           ['28px', { lineHeight: '1.14', letterSpacing: '0.196px', fontWeight: '400' }],
        tagline:        ['21px', { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '600' }],
        body:           ['17px', { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '400' }],
        'body-strong':  ['17px', { lineHeight: '1.24', letterSpacing: '-0.374px', fontWeight: '600' }],
        caption:        ['14px', { lineHeight: '1.43', letterSpacing: '-0.224px', fontWeight: '400' }],
        'caption-strong':['14px', { lineHeight: '1.29', letterSpacing: '-0.224px', fontWeight: '600' }],
        'fine-print':   ['12px', { lineHeight: '1.0', letterSpacing: '-0.12px', fontWeight: '400' }],
        'nav-link':     ['12px', { lineHeight: '1.0', letterSpacing: '-0.12px', fontWeight: '400' }],
      },
      borderRadius: {
        none: '0px',
        slot: '4px',
        panel: '6px',
        xs:   '5px',
        sm:   '8px',
        md:   '11px',
        lg:   '18px', // Apple store utility card radius
        xl:   '20px',
        '2xl': '24px',
        pill: '9999px',
        full: '9999px',
      },
      spacing: {
        xxs: '4px',
        xs:  '8px',
        sm:  '12px',
        md:  '17px',
        lg:  '24px',
        xl:  '32px',
        xxl: '48px',
        section: '80px',
      },
      maxWidth: {
        container: '1020px',
        gallery:   '1280px',
        board:     '1020px',
      },
    },
  },
  plugins: [],
}
