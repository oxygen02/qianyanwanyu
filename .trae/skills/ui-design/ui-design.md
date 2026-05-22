---
name: "ui-design"
description: "Professional UI design and frontend interface guidelines. Use when creating web pages, mini-program interfaces, prototypes, or any frontend UI components."
---

# UI Design Skill

## Purpose
Professional UI design and frontend interface guidelines for creating distinctive, production-grade interfaces with exceptional aesthetic quality.

## When to Use
- Creating web pages or interfaces
- Creating mini-program pages or interfaces
- Designing frontend components
- Creating prototypes or interfaces
- Handling styling and visual effects

## Design Process

### 1. Design Specification First (MANDATORY)
Before writing ANY interface code, complete the design specification:
- **Purpose Statement**: What the interface accomplishes
- **Aesthetic Direction**: Visual style (minimal, bold, elegant, etc.)
- **Color Palette**: Primary, secondary, accent, neutral colors
- **Typography**: Font families, sizes, weights
- **Layout Strategy**: Grid system, spacing, responsive breakpoints

### 2. UX Analysis
- User journey mapping
- Information architecture
- Interaction patterns
- Accessibility considerations

### 3. Aesthetic Direction
- Define visual language
- Establish component style
- Create animation guidelines

### 4. UI Implementation
- Mobile-first responsive design
- Component composition
- Consistent spacing system
- State management (hover, focus, active, disabled)

## Design Rules

### Forbidden Practices
- **Colors**: Avoid purple, violet, indigo, fuchsia, blue-purple gradients
- **Fonts**: Avoid Inter, Roboto, Arial, Helvetica, system-ui
- **Layouts**: Avoid standard centered layouts without creative breaking
- **Icons**: Never use emoji as icons - use professional icon libraries

### Color System
```
Primary: #6B5B4F (Warm brown for brand)
Secondary: #FAF7F2 (Paper cream for backgrounds)
Accent: #C41E3A (Vermillion for CTAs)
Text Primary: #3D2B1F (Dark brown)
Text Secondary: #8B7355 (Medium brown)
```

### Typography Scale
```
Display: 32-48px, weight 700
Heading: 24-32px, weight 600
Body: 16-18px, weight 400
Caption: 12-14px, weight 400
```

### Spacing System
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

## Self-Audit Checklist
Before submitting UI code:
- [ ] No forbidden colors used
- [ ] No forbidden fonts used
- [ ] No emoji icons (use SVG/Icon fonts)
- [ ] Asymmetric/creative layout
- [ ] Design specification compliance
- [ ] Responsive on mobile
- [ ] Touch-friendly targets (min 44px)
- [ ] Loading states implemented
- [ ] Error states implemented

## Expected Output
Production-ready frontend code with distinctive aesthetic quality.
