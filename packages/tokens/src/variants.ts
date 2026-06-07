/**
 * Variant tokens as a TypeScript string — consumable by Shadow DOM
 * renderers that can't inherit the document-level `[data-variant]`
 * cascade (every `@pulse/web-component` Custom Element).
 *
 * SINGLE SOURCE OF TRUTH for the 4 mood gradients. Previously
 * declared twice: once in `variants.css` (for document-level
 * consumers) and once as `:host([variant='X'])` rules inside
 * `@pulse/web-component/src/styles.ts`. Drift inevitable.
 *
 * Now: this string is the canonical declaration. The CSS file
 * (`variants.css`) is a copy generated for plain-CSS consumers
 * (Vue v2.3.4, plain HTML pages). The web-component package
 * consumes the string via `unsafeCSS(variantsCss)` so the SAME
 * stops/rgb triplets land in both the document and the Shadow DOM.
 */
export const variantsCss = `
[data-variant='sunset'] {
  --variant-bg-gradient: linear-gradient(135deg, #1a1410 0%, #2d241c 50%, #4a3527 100%);
  --variant-accent-rgb: 245, 158, 11;
}

[data-variant='midnight'] {
  --variant-bg-gradient: linear-gradient(135deg, #0a0a18 0%, #14142a 50%, #1a1a3a 100%);
  --variant-accent-rgb: 139, 92, 246;
}

[data-variant='aurora'] {
  --variant-bg-gradient: linear-gradient(135deg, #061a1a 0%, #0a2e2e 40%, #103040 100%);
  --variant-accent-rgb: 6, 182, 212;
}

[data-variant='vinyl'] {
  --variant-bg-gradient:
    radial-gradient(ellipse at 30% 20%, rgba(200, 169, 126, 0.06) 0%, transparent 60%),
    linear-gradient(135deg, #030302 0%, #0a0907 50%, #1a1712 100%);
  --variant-accent-rgb: 200, 169, 126;
}

[data-variant='dark'] {
  --variant-bg-gradient: linear-gradient(135deg, #0e0e12 0%, #1a1a22 100%);
  --variant-accent-rgb: 255, 255, 255;
}

[data-variant='light'] {
  --variant-bg-gradient: #f4f4f7;
  --variant-accent-rgb: 20, 20, 26;
}

[data-variant='solid'] {
  --variant-bg-gradient: #14141a;
  --variant-accent-rgb: 255, 255, 255;
}

[data-variant='transparent'] {
  --variant-bg-gradient: transparent;
  --variant-accent-rgb: 255, 255, 255;
}
`
