---
name: Modern Technical Excellence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#1E293B'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#fff3f4'
  on-tertiary: '#66002c'
  tertiary-container: '#ffccd6'
  on-tertiary-container: '#bb0058'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#ffb1c3'
  on-tertiary-fixed: '#3f0019'
  on-tertiary-fixed-variant: '#8f0041'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  surface-deep: '#020617'
  success-mint: '#00FFAB'
  warning-amber: '#FBBF24'
  error-rose: '#F43F5E'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 8px
  gutter-desktop: 24px
  margin-desktop: 64px
  gutter-mobile: 16px
  margin-mobile: 20px
  max-width: 1280px
---

## Brand & Style

This design system is engineered for high-performance environments where clarity, precision, and trust are paramount. The brand personality is authoritative yet approachable, favoring functional aesthetics over decorative excess. The target audience consists of professionals who value efficiency and data density without sacrificing visual polish.

The chosen design style is **Corporate / Modern** with a **Minimalist** ethos. It utilizes heavy whitespace to reduce cognitive load, combined with high-quality typography to establish a clear information hierarchy. By stripping away unnecessary ornamentation, the design system ensures that content remains the focal point, while subtle translucent layers provide a sense of sophisticated depth.

## Colors

The color strategy for this design system is built upon a high-contrast dark mode foundation. The primary palette uses a vibrant "Electric Cyan" to draw attention to interactive elements and key status indicators. Secondary and tertiary colors are reserved for data visualization and subtle accents, ensuring they do not compete with primary actions.

The neutral palette is grounded in deep slates and navies, providing a more sophisticated and less "harsh" experience than pure black. Backgrounds should utilize `surface-deep` for the main canvas, while `surface-bright` is used for cards and floating containers to create a logical hierarchy of information.

## Typography

The typography system strikes a balance between human-centric readability and technical precision. **Hanken Grotesk** serves as the primary typeface for all editorial and interface copy, chosen for its clean, geometric lines and exceptional legibility at various weights. 

For technical data, code snippets, and metadata labels, **JetBrains Mono** is utilized. This monospaced font provides the necessary structure for data-heavy views, ensuring that numerical values and identifiers are easily scannable. All large headlines use tight negative letter-spacing to maintain a modern, "locked-in" appearance, while small labels use expanded tracking for better readability in high-density layouts.

## Layout & Spacing

This design system employs a **fixed grid** model for desktop environments to maintain a premium, editorial feel, while transitioning to a **fluid grid** for mobile devices. The layout is structured on an 8px rhythm, ensuring all components and spatial relationships are mathematically consistent.

- **Desktop (1280px+):** A 12-column centered grid with 24px gutters. The max-width container prevents content from over-stretching on ultra-wide displays.
- **Tablet (768px - 1279px):** An 8-column grid with 24px gutters and 40px side margins.
- **Mobile (Below 768px):** A 4-column fluid grid with 16px gutters and 20px margins. 

Spacing units follow a geometric scale (8, 16, 24, 32, 48, 64, 96) to create clear sections and group related content logically.

## Elevation & Depth

Visual hierarchy is established primarily through **tonal layers** and **low-contrast outlines**, avoiding the use of traditional heavy shadows. Depth is communicated by subtly shifting the background color of containers—as elements "rise" closer to the user, they become slightly lighter (`surface-bright`).

For high-priority modals or floating menus, the design system utilizes **Glassmorphism**. These elements should feature a `backdrop-filter: blur(12px)` and a semi-transparent border (1px, 10% white) to simulate physical glass. This allows the user to maintain context of the underlying layers while focusing on the foreground task.

## Shapes

The shape language is characterized by "Soft" geometry. A standard radius of `0.25rem` (4px) is applied to small components like buttons and input fields to provide a hint of approachability without feeling overly playful. 

Larger containers, such as cards and modals, utilize a `0.5rem` (8px) radius (`rounded-lg`) to soften the overall interface. This consistent, restrained use of rounded corners reinforces the professional and systematic nature of the design system, ensuring it feels modern but structurally sound.

## Components

### Buttons
Primary buttons use the `primary_color_hex` with black text for maximum contrast. They feature a subtle 1px inner glow on the top edge to simulate a slight 3D tactile feel. Secondary buttons use a ghost style with the `primary_color_hex` for the border and text.

### Inputs
Input fields are styled with a `surface-deep` background and a 1px `surface-bright` border. On focus, the border transitions to the primary cyan with a soft, 2px outer glow of the same color. Labels should always use the `label-caps` typography style.

### Cards
Cards are the primary container for content. They should have no shadow but instead use a 1px border of `surface-bright`. When grouped, maintain a 24px gap between cards to allow the background to breathe.

### Chips
Chips are used for categorization and should be rendered with a subtle fill (10% opacity of the category color) and a matching text color. They use the `label-data` font size for compact information delivery.

### Lists
List items should be separated by 1px horizontal dividers in `surface-bright`. Hover states on list items should be indicated by a subtle shift to a slightly lighter background color rather than a change in border or text.