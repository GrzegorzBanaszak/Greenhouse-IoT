---
name: Botanical Intelligence
colors:
  surface: '#f5fced'
  surface-dim: '#d5dcce'
  surface-bright: '#f5fced'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff6e7'
  surface-container: '#e9f0e1'
  surface-container-high: '#e3ebdc'
  surface-container-highest: '#dee5d6'
  on-surface: '#171d14'
  on-surface-variant: '#40493d'
  inverse-surface: '#2c3228'
  inverse-on-surface: '#ecf3e4'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#286b33'
  on-secondary: '#ffffff'
  secondary-container: '#abf4ac'
  on-secondary-container: '#2e7238'
  tertiary: '#415b45'
  on-tertiary: '#ffffff'
  tertiary-container: '#59745c'
  on-tertiary-container: '#daf9db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#abf4ac'
  secondary-fixed-dim: '#90d792'
  on-secondary-fixed: '#002107'
  on-secondary-fixed-variant: '#07521d'
  tertiary-fixed: '#cceacd'
  tertiary-fixed-dim: '#b1ceb2'
  on-tertiary-fixed: '#07200e'
  on-tertiary-fixed-variant: '#334d37'
  background: '#f5fced'
  on-background: '#171d14'
  surface-variant: '#dee5d6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 16px
  margin-mobile: 20px
  margin-tablet: 40px
---

## Brand & Style
The design system is engineered to feel like a premium IoT extension of a living ecosystem. It balances the precision of agricultural technology with the organic warmth of nature. The target audience includes urban gardeners and commercial greenhouse operators who require immediate, glanceable data and high-confidence controls.

The aesthetic follows a **Modern Minimalist** approach with a **Tactile** edge. It utilizes heavy whitespace, expansive corner radii, and soft depth to create an interface that feels as clean and intentional as a well-tended greenhouse. The emotional goal is to evoke a sense of calm, control, and environmental harmony, moving away from "industrial" automation toward "lifestyle" botanical management.

## Colors
The palette is rooted in deep botanical tones. The **Primary Forest Green** is used for critical actions and active states, providing high legibility and a sense of growth. The **Secondary Leaf Green** acts as a supporting accent for data visualization and secondary toggles.

The **Background** uses a very light sage to reduce eye strain and differentiate from standard "stark white" digital products, creating a more organic canvas. **Surface** colors are reserved for floating cards and interactive containers, ensuring they "pop" against the sage backdrop. Functional colors (Amber/Red) are used sparingly to signal health alerts or irrigation failures.

## Typography
This design system utilizes **Inter** exclusively to maintain a functional, systematic, and highly legible appearance. The type scale is generous, prioritizing readability in humid or outdoor environments where glare might be present. 

Headlines use a slightly tighter letter-spacing and heavier weights to anchor the page. Data points (like temperature or humidity percentages) should utilize the `display-lg` or `headline-lg` roles to ensure they are the primary focal point of the dashboard. Labels are set in semi-bold all-caps for distinct categorization of sensor data.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for Android's flexible screen sizes. It uses a 4px baseline grid to ensure all components and text remain aligned. 

- **Mobile:** 4-column layout with 20px side margins.
- **Tablet:** 8-column layout with 40px side margins and a maximum content width of 1024px.
- **Vertical Rhythm:** A consistent 24px (`lg`) gap between cards and 12px (`sm`) gap between related internal card elements. 

The philosophy is "breathable data"—avoiding dense clusters of information in favor of wide, touch-friendly modules.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh blacks in shadows, instead using a soft `rgba(46, 125, 50, 0.08)` (a tinted Forest Green shadow) to maintain a natural feel.

- **Level 0 (Base):** Background Sage (#F1F8E9).
- **Level 1 (Cards):** White surface with an 8px blur, 4px Y-offset shadow. Used for primary dashboard widgets.
- **Level 2 (Active/Modals):** White surface with a 16px blur, 8px Y-offset shadow. Used for bottom sheets and active selection states.

Interactions should feel soft; when a user presses a card, it should subtly "sink" (reduce elevation) to provide tactile feedback.

## Shapes
The shape language is extremely organic. Following the "Pill-shaped" philosophy, all primary containers and buttons feature a **24px to 32px** corner radius. 

- **Primary Cards:** 24px radius (`rounded-lg`).
- **Buttons & Inputs:** Fully rounded/Pill-shaped (`rounded-xl`).
- **Selection Indicators:** Small 8px radius for internal badges or status indicators.

These oversized radii mimic the soft curves of leaves and greenhouses, reinforcing the brand's friendly and approachable IoT identity.

## Components

### Buttons
- **Primary:** High-saturation Forest Green, white text, pill-shaped, 56px height for touch accessibility.
- **Ghost:** Forest Green border (2px), transparent fill, for secondary actions like "View History."

### Cards
- **Sensor Cards:** White background, 24px radius, featuring a large numerical value (e.g., "24°C") and a secondary `label-lg` describing the sensor location.
- **Control Cards:** Feature a toggle switch or a large icon button (Water drop, Pump) with an "Active" state that shifts the card background to `tertiary_color_hex`.

### Circular Progress
- Used for moisture levels and nutrient tanks. Use a thick 8px stroke. The background track should be `neutral_color_hex` and the progress fill `secondary_color_hex`.

### Status Badges
- Small, pill-shaped tags (e.g., "Online", "Irrigating"). Use low-contrast backgrounds (e.g., light green fill with dark green text) to avoid visual clutter.

### Bottom Navigation
- A clean, white bar with a subtle top border. Active icons use the `primary_color_hex` with a soft green glow underneath the icon to indicate selection.

### Input Fields
- Pill-shaped with a light sage background. The focus state should use a 2px Forest Green border.