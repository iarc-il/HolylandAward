# HolyLand Award Design System

## Overview
This document outlines the complete design system applied to the HolyLand Award frontend application, ensuring consistency and accessibility across all components.

---

## Color Palette

### Primary Colors
- **Background**: `#FFFFFF` (White) - Main content areas
- **Secondary Background**: `#F8F9FA` (Light Gray) - Subtle sections, footers, sidebar
- **Foreground/Text**: `#333333` (Dark Gray) - Body text and headings

### Accent Colors
- **Primary Blue**: `#3498DB` - Buttons, links, active states
- **Light Blue**: `#AED6F1` - Hover states, highlights, accents
- **Warning Yellow**: `#FFFF00` - Urgent notices, alerts (reserved for important notifications)

### Neutral Tones
- **Border**: `#DEE2E6` - Minimal borders and dividers
- **Muted Text**: `#6C757D` - Secondary text, timestamps, icons

### Semantic Colors
- **Destructive**: `#DC3545` - Error states, delete actions
- **Success**: Accent colors used for success states

### Dark Mode (Minimal)
Dark mode maintains the clean aesthetic with subtle blue tints while preserving readability.

---

## Typography

### Font Family
```css
font-family: 'Rubik', 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
```

**Hebrew Support**: 'Assistant' and 'Rubik' fonts provide excellent Hebrew character support.

### Font Sizes & Weights

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| **H1** | 48-60px | 700 (Bold) | Main page titles, banner headings |
| **H2** | 32px | 600 (Semi-bold) | Section headings |
| **H3** | 24px | 600 (Semi-bold) | Card titles, subsections |
| **H4** | 20px | 600 (Semi-bold) | Minor headings |
| **Body** | 16px | 400 (Regular) | Standard text, paragraphs |
| **Small** | 14px | 400 (Regular) | Secondary information, labels |
| **Extra Small** | 12px | 400 (Regular) | Timestamps, metadata, fine print |

### Line Height
- **Headings**: 1.2-1.4 for tighter spacing
- **Body Text**: 1.6 for optimal readability
- **Small Text**: 1.4-1.5

### RTL Support
The design system includes full RTL (Right-to-Left) support for Hebrew:
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

---

## Spacing System

### Card Padding
- **Default**: 1.5rem (24px)
- **Compact**: 1rem (16px)

### Button Padding
- **Default**: 8-12px vertical, 16-24px horizontal
- **Small**: 6-8px vertical, 12-16px horizontal
- **Large**: 12-16px vertical, 24-32px horizontal

### Section Spacing
- **Mobile**: 2rem (32px) between major sections
- **Desktop**: 3rem (48px) between major sections

### Grid Gaps
- **Default**: 1.5rem (24px)
- **Large**: 2rem (32px)

---

## Borders & Radius

### Border Radius
- **Primary**: 12px (`--radius: 0.75rem`) - Cards, dialogs, major components
- **Buttons**: Fully rounded (`rounded-full`) for pill-shaped appearance
- **Inputs/Selects**: 8px (`rounded-lg`)
- **Checkboxes**: 6px (`rounded-md`)

### Borders
- **Width**: Minimal 1-2px borders
- **Color**: `#DEE2E6` (subtle gray)
- **Style**: Solid, used sparingly

---

## Shadows

### Card Shadows
```css
/* Default */
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

/* Hover */
box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);

/* Active/Focused */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

### Elevation Levels
- **Base**: Minimal shadow for separation
- **Elevated**: Medium shadow for interactive elements
- **Floating**: Strong shadow for modals and overlays

---

## Components

### Buttons

#### Variants
1. **Default** (Primary)
   - Background: `#3498DB`
   - Text: White
   - Hover: `#2980B9` (darker blue)
   - Fully rounded (pill-shaped)

2. **Accent**
   - Background: `#AED6F1` (light blue)
   - Text: `#333333`
   - Hover: Slightly darker

3. **Outline**
   - Border: 2px `#DEE2E6`
   - Background: Transparent
   - Hover: Light blue background

4. **Ghost**
   - Transparent background
   - Hover: Light accent background

#### Sizes
- **Small**: Height 32px (2rem)
- **Default**: Height 40px (2.5rem)
- **Large**: Height 48px (3rem)

### Cards

#### Structure
```tsx
<div className="p-6 bg-card border border-border rounded-xl shadow-md">
  {/* Content */}
</div>
```

#### Features
- Rounded corners (12px)
- Subtle shadow for depth
- Hover animation: lift and increase shadow
- Smooth transitions (300ms)

### Inputs

#### Features
- Height: 40px (10 units)
- Padding: 16px horizontal
- Border radius: 8px
- Hover: Border color changes to accent
- Focus: Ring effect with primary color

### Dialogs/Modals

#### Structure
- Rounded corners: 12px
- Close button: Circular with hover effect
- Overlay: Semi-transparent black background
- Animation: Smooth fade-in/zoom-in

---

## Layout

### Grid System
```css
/* Mobile-first responsive grid */
.card-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
}

@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  gap: 2rem;
}
```

### Sidebar
- Width: 16rem (256px) on desktop
- Background: `#F8F9FA` (light gray)
- Active items: `#3498DB` background
- Hover: `#AED6F1` background
- Mobile: Collapsible sheet overlay

### Container
- Max width: 1280px
- Centered with auto margins
- Responsive padding: 1rem mobile, 2rem desktop

---

## Interactions & Animations

### Transitions
- **Duration**: 200-300ms for most interactions
- **Easing**: `ease` or `ease-in-out`
- **Properties**: `all`, `transform`, `box-shadow`, `background-color`

### Hover Effects
1. **Cards**: Lift up 2px, increase shadow
2. **Buttons**: Darken background, increase shadow
3. **Links**: Underline, color change to darker blue
4. **Inputs**: Border color change, subtle shadow

### Focus States
- **Ring**: 3px outline with primary color
- **Offset**: 2px from element
- **High contrast** for accessibility

---

## Accessibility

### Contrast Ratios
- **Body text**: High contrast (#333333 on #FFFFFF) - WCAG AAA compliant
- **Interactive elements**: Clear visual feedback
- **Focus indicators**: Prominent 3px rings

### RTL Support
- Full Hebrew language support
- Automatic text alignment
- Proper font rendering

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Visible focus states
- Logical tab order

### Screen Reader Support
- Semantic HTML elements
- ARIA labels where appropriate
- Hidden labels for icon-only buttons

---

## Usage Examples

### Creating a Card
```tsx
<div className="p-6 bg-card border border-border rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
  <h3 className="font-semibold mb-3 text-lg">Card Title</h3>
  <p className="text-muted-foreground">Card content goes here</p>
</div>
```

### Primary Button
```tsx
<Button size="lg" className="min-w-[150px]">
  Click Me
</Button>
```

### Input Field
```tsx
<Input 
  type="text" 
  placeholder="Enter text..." 
  className="w-full"
/>
```

### Page Header
```tsx
<div className="space-y-2">
  <h1 className="text-4xl md:text-5xl font-bold">Page Title</h1>
  <p className="text-muted-foreground text-base">Page description</p>
</div>
```

---

## Best Practices

1. **Consistency**: Use design tokens and existing components
2. **Spacing**: Follow the 4px/8px grid system
3. **Colors**: Stick to the defined palette
4. **Typography**: Use the established hierarchy
5. **Accessibility**: Always include proper contrast and focus states
6. **Responsive**: Design mobile-first, enhance for larger screens
7. **Performance**: Use CSS transitions, avoid heavy animations

---

## Files Modified

### Core Styles
- `src/index.css` - Design tokens, global styles, typography
- `src/App.css` - Layout utilities, card styles, container rules

### Components
- `src/components/ui/button.tsx` - Pill-shaped buttons with variants
- `src/components/ui/input.tsx` - Enhanced input styling
- `src/components/ui/dialog.tsx` - Modal components
- `src/components/ui/select.tsx` - Dropdown styling
- `src/components/ui/checkbox.tsx` - Checkbox styling
- `src/components/AppSidebar.tsx` - Sidebar navigation
- `src/components/Dashboard/index.tsx` - Main dashboard layout
- `src/components/Dashboard/components/StatsCard.tsx` - Statistics cards
- `src/components/UploadPage.tsx` - File upload interface
- `src/App.tsx` - Root application layout

---

## Future Enhancements

1. **Dark Mode Toggle**: Add user preference for dark/light mode
2. **Animation Library**: Consider adding more sophisticated animations
3. **Component Library**: Document all components in Storybook
4. **Theming**: Allow customization of color palette
5. **Internationalization**: Expand RTL support to full i18n system

---

**Last Updated**: February 4, 2026
**Version**: 1.0
