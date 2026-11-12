---
name: Phantom Design System
colors:
  surface: '#141121'
  surface-dim: '#141121'
  surface-bright: '#3a3749'
  surface-container-lowest: '#0f0c1c'
  surface-container-low: '#1c192a'
  surface-container: '#211d2e'
  surface-container-high: '#2b2839'
  surface-container-highest: '#363244'
  on-surface: '#e6dff7'
  on-surface-variant: '#cac4d5'
  inverse-surface: '#e6dff7'
  inverse-on-surface: '#322e40'
  outline: '#938e9e'
  outline-variant: '#484552'
  surface-tint: '#cbbeff'
  primary: '#cbbeff'
  on-primary: '#33118c'
  primary-container: '#9a84f8'
  on-primary-container: '#300c89'
  inverse-primary: '#624bbc'
  secondary: '#c9c2e2'
  on-secondary: '#312d46'
  secondary-container: '#48435e'
  on-secondary-container: '#b8b1d0'
  tertiary: '#eac33f'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca823'
  on-tertiary-container: '#4e3e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cbbeff'
  on-primary-fixed: '#1d0061'
  on-primary-fixed-variant: '#4a31a2'
  secondary-fixed: '#e6deff'
  secondary-fixed-dim: '#c9c2e2'
  on-secondary-fixed: '#1c1830'
  on-secondary-fixed-variant: '#48435e'
  tertiary-fixed: '#ffe082'
  tertiary-fixed-dim: '#e9c33f'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#564500'
  background: '#141121'
  on-background: '#e6dff7'
  surface-variant: '#363244'
  canvas-base: '#0B0914'
  surface-deep: '#151224'
  surface-raised: '#221E36'
  surface-highlight: '#2F2B4A'
  brand-accent: '#AB9FF2'
  text-primary: '#F7F4FD'
  text-secondary: '#AFA8CE'
  text-muted: '#6E668B'
  status-success: '#3DD598'
  status-warning: '#FFC542'
  status-danger: '#FF5757'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

The design system embodies the premier, sovereign gateway to Web3 and digital ownership. It bridges decentralized infrastructure with consumer-grade intimacy, effortless fluidity, and institutional trust. The visual aesthetic fuses Modern Dark Minimalist UX with refined Glassmorphism, projecting an air of privacy, celestial depth, and high-frequency precision.

The target audience ranges from daily DeFi operators, NFT collectors, and Web3 natives to newcomers demanding a secure, frictionless wallet experience. Interfaces must prioritize quiet confidence, clarity during high-stakes financial operations, and velvety tactile interactions that make cryptography feel organic rather than clinical.

## Colors

The palette operates natively in an atmospheric dark mode. The chromatic hierarchy establishes depth through deep void-tinted neutrals, layered purple surfaces, and vibrant ethereal violet accents:

- **Primary (`#9A84F8`)**: The signature electric violet. Reserved for primary calls to action, active navigation states, selected token highlights, and prominent transaction approvals.
- **Secondary (`#221E36`)**: Deep twilight slate-purple used for structural containers, module cards, inputs, and layered surface geometry.
- **Canvas Base (`#0B0914`)**: Ultra-deep void purple creating high-contrast separation without the harshness of pure `#000000`.
- **Text & Accents**: Headings and primary copy leverage `#F7F4FD` for crisp legibility, while `#AFA8CE` and `#6E668B` modulate visual priority. Semantic tokens (`#3DD598` for yield/positive delta, `#FF5757` for gas burn/negative states) pierce the violet palette with surgical clarity.

## Typography

The typographic hierarchy blends geometric innovation with extreme transactional readability:

- **Display & Headlines (`Sora`)**: Expresses modern Web3 velocity and forward-looking momentum. Its subtle horizontal cadence anchors account balances, hero banners, and section dividers.
- **Body & Controls (`DM Sans`)**: Provides low-fatigue readability across token directories, transaction summaries, and security dialogues. Maintains balanced spacing at compact sizes.
- **Monospace / Protocol Tokens (`JetBrains Mono`)**: Strict, technical legibility dedicated to raw cryptographic primitives: wallet addresses, hash outputs, gas estimates, contract IDs, and numerical asset quantities.

## Layout & Spacing

The layout model is anchored by a structured fluid grid adapting across three primary viewport tiers:
- **Desktop (>= 1200px)**: 12-column grid with `margin: 2rem` and `gutter: 1.5rem`. Max-width constrained to `1280px` for marketing or full dashboards; compact extension layouts use a fixed centered `420px` viewport frame.
- **Tablet (768px - 1199px)**: 8-column layout accommodating modular multi-panel cards.
- **Mobile (< 768px)**: 4-column layout utilizing bottom-anchored sheets, `margin-sm: 1.25rem`, and full-width edge-padded interactive cards.

Spatial cadence relies strictly on an 8pt base unit. Layout density scales tightly around data cards (`space-md`) while marketing canvases breathe with open expanses (`space-xl` to `space-2xl`).

## Elevation & Depth

Visual hierarchy combines stacked translucent layers, ambient purple luminescence, and razor-sharp border boundaries:

- **Layer 0 (Canvas Base)**: The deep abyss (`#0B0914`), devoid of blur.
- **Layer 1 (Card & Module Foundation)**: Translucent surface `#151224` with `backdrop-filter: blur(16px)` and a subtle `1px` inner boundary of `rgba(247, 244, 253, 0.08)`.
- **Layer 2 (Floating Modals & Dropdowns)**: `#221E36` elevated with ambient cast shadows: `0 16px 40px -8px rgba(11, 9, 20, 0.7), 0 0 24px -4px rgba(154, 132, 248, 0.12)`.
- **Interactive Luminescence**: Focused inputs and activated primary surfaces emit a soft, diffused violet halo (`box-shadow: 0 0 0 3px rgba(154, 132, 248, 0.35)`). Borders use delicate, non-solid gradient strokes to imply glass edge refraction.

## Shapes

The design system maintains a balanced, friendly geometric radius (`roundedness: 2`). Standard containers, token list items, and modal interfaces adopt `0.5rem` to `1rem` corner rounding.

Key interactive triggers (e.g., CTA buttons, filter pills, and token search chips) use full pill radiuses (`rounded-full`) to deliver a smooth, tactile handheld feeling that references hardware tokens and streamlined biometric devices. Inner nested elements strictly scale down their corner radius relative to their parent container to preserve optical concentricity.

## Components

### Buttons
- **Primary**: Bold violet background (`#9A84F8`) with dark violet text (`#100D1D`), font `label-md`. Rounded-full pill contour. Hover initiates subtle brightness increase with radial violet glow; active state scales down slightly (`transform: scale(0.98)`).
- **Secondary**: Translucent surface (`rgba(34, 30, 54, 0.6)`) with high-contrast text (`#F7F4FD`), 1px border (`rgba(247, 244, 253, 0.1)`), backdrop blur 12px.
- **Ghost / Destructive**: Borderless ghost with secondary hover highlight; destructive actions utilize a muted wine surface with intense crimson label (`#FF5757`).

### Glass Cards & Containers
- Cards feature layered backdrops (`#151224` at 70% opacity, 20px blur), framed by a hairline top-weighted stroke (`linear-gradient(180deg, rgba(247, 244, 253, 0.12), rgba(247, 244, 253, 0.02))`).
- Hovering interactive cards activates an elevated ambient violet edge-glow (`rgba(154, 132, 248, 0.2)`).

### Input Fields & Address Bars
- Background set to deep surface fill (`#151224`), height standard at 52px for primary amounts and 44px for secondary inputs.
- Active focus invokes a vivid `1.5px` border of `#9A84F8` with a soft outer ring. Integrated suffix buttons (e.g., "MAX", currency switchers) sit flush within the input padding with a muted pill style.

### Chips & Badges
- Network and status indicators are compact (24px height), pill-shaped, and filled with 10% opacity fills corresponding to network status (e.g., green tint for Solana, blue for Ethereum, purple for Polygon). Text is set in `label-sm`.

### Lists & Asset Rows
- Divided by hairline borders (`rgba(247, 244, 253, 0.05)`). Token rows use an organic horizontal layout: rounded circular token badge on left, primary symbol and network vertically stacked, balance and fiat conversion aligned right using `mono-data`.
- Row items reveal a soft, rounded hover backdrop (`rgba(154, 132, 248, 0.06)`) transitioning at 150ms ease-out.

### Checkboxes, Radios, & Sliders
- Checkbox and radio components are enclosed in 20px `#221E36` housings. Selected states snap to `#9A84F8` with pure white check iconography.
- Sliders for slippage and gas selection feature an animated segmented pill control with smooth spring-physics indicator transitions.