# Tech Stack

- You are building a React application with **modern, premium design**.
- Use TypeScript for all files.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- **CRITICAL**: UPDATE the main page to include new components. Otherwise users can't see them!
- ALWAYS use the shadcn/ui library for components.
- Tailwind CSS: Use Tailwind classes extensively for layout, spacing, colors, and design.
- Follow the **NatiStyle UI/UX Guidelines** below.
- Create beautiful, minimal Landing Pages with generous spacing.

## 🚨 CRITICAL: Always Update Index.tsx

**EVERY TIME you create a new component, you MUST update `src/pages/Index.tsx` to display it.**

**Why?** The Index.tsx page is what users see first. If you don't add your component there, users won't see your work!

**Example workflow:**
1. User asks: "Create a hero section component"
2. You create: `src/components/HeroSection.tsx`
3. **YOU MUST** update: `src/pages/Index.tsx` to import and render `<HeroSection />`
4. Result: User immediately sees the hero section

**How to update Index.tsx:**
```tsx
// Import your new component
import YourComponent from "@/components/YourComponent";

// Add it to the JSX (replace or add to existing content)
<main className="flex-1 flex items-center justify-center p-8">
  <div className="max-w-6xl mx-auto w-full">
    <YourComponent />
  </div>
</main>
```

**Never skip this step!** Think of Index.tsx as the showcase for everything you build.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

## NatiStyle UI/UX Guidelines - Premium Minimal Design

### **Design Philosophy: $10k Landing Page Aesthetic**

Create apps that look and feel premium, minimal, and professional. Think Apple, Linear, Vercel.

### **Color System**
- **Primary Palette**: Pure monochrome (black, white, grays)
  - Light mode: White background (#FFFFFF) with dark text (#171717)
  - Dark mode: Deep charcoal (#0A0A0A) with white text (#FAFAFA)
  - Muted text: Mid-grays (#737373 light, #A3A3A3 dark)
- **Avoid**: Bright colors, gradients, colored backgrounds
- **Use color sparingly**: Only for CTAs, success states, or brand accent
- **Theme-aware**: Always use CSS variables: `bg-background`, `text-foreground`, `text-muted-foreground`

### **Typography**
- **Headings**: Large, bold, generous spacing
  - Hero: `text-5xl md:text-6xl font-bold tracking-tight`
  - Section: `text-3xl md:text-4xl font-bold`
  - Card title: `text-xl font-semibold`
- **Body text**: Readable, not too small
  - Large: `text-xl md:text-2xl` for hero descriptions
  - Regular: `text-base` (16px)
  - Small: `text-sm` (14px)
- **Line height**: Use `leading-relaxed` for readability

### **Spacing & Layout**
- **Generous whitespace**: Don't crowd elements
  - Sections: `py-20` or `py-24`
  - Cards: `p-8` or `p-10`
  - Between elements: `gap-8` minimum
- **Max widths**: Keep content readable
  - Hero: `max-w-3xl` or `max-w-4xl`
  - Text: `max-w-2xl`
  - Containers: `max-w-7xl`
- **Responsive**: Mobile-first with proper breakpoints

### **Buttons & CTAs**
- **Large click targets**: `px-8 py-4` minimum
- **Rounded corners**: `rounded-xl` for modern feel
- **Primary CTA**: `bg-foreground text-background` (inverted colors)
- **Secondary**: `border-2 border-border hover:border-foreground`
- **Hover states**: Subtle transitions (`transition-all duration-200`)

### **Glass Effects (Use Sparingly)**
- **When to use**: Floating elements, overlays, secondary UI
- **Primary surfaces**: Use solid backgrounds for readability
- **Glass classes**:
  - `glass-surface` → frosted background with blur
  - `glass-hover` → subtle hover transitions
  - `glass-button` → glass button styling
  - `glass-active` → scale animation on click

### **Components**
- **Cards**: Clean borders, minimal shadows
  ```tsx
  className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors"
  ```
- **Forms**: Clear labels, proper spacing
  ```tsx
  <input className="px-4 py-3 rounded-lg border border-border focus:border-foreground" />
  ```
- **Empty states**: Simple, centered
  ```tsx
  <div className="text-center py-12">
    <p className="text-muted-foreground">No items yet</p>
  </div>
  ```

### **Icons & Images**
- **Icons**: Use lucide-react, keep them 20-24px (`size={20}`)
- **Emojis**: Use sparingly for visual interest (⚡🤖🎨)
- **Images**: High quality, proper aspect ratios

### **Accessibility**
- **Focus states**: Always use `focus-visible:ring-2 ring-offset-2`
- **Color contrast**: Test in both light and dark modes
- **Touch targets**: Minimum 44px × 44px
- **Labels**: Proper aria-labels for screen readers

### Premium Utilities Available

**Glass Effects:**
- `glass-surface` → Frosted background with backdrop blur
- `glass-hover` → Smooth hover transitions
- `glass-button` → Glass button styling
- `glass-active` → Scale animation on click
- `glass-contrast-text` → Readable text on glass

**Animations:**
- `animate-fade-in` → Subtle entrance animation
- `transition-all duration-200` → Smooth transitions

**Shadows:**
- `shadow-premium` → Elegant soft shadows
- `shadow-premium-lg` → Larger premium shadows

### Component Creation Defaults

- **Start simple**: Solid backgrounds first, add glass selectively
- **Use shadcn/ui**: Leverage pre-built components
- **Extend, don't edit**: Create new components instead of modifying library files
- **Mobile-first**: Build responsive by default
- **Dark mode**: Always test both themes

## Landing Page Best Practices

### **Hero Section**
```tsx
<section className="min-h-screen flex items-center justify-center p-8">
  <div className="text-center max-w-3xl mx-auto">
    {/* Logo */}
    <div className="mb-8">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 shadow-lg" />
    </div>
    
    {/* Hero heading */}
    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
      Your Amazing Product
    </h1>
    
    {/* Description */}
    <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
      A beautiful description that explains the value proposition clearly.
    </p>
    
    {/* CTAs */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a className="px-8 py-4 rounded-xl bg-foreground text-background hover:opacity-90 transition-all">Get Started</a>
      <a className="px-8 py-4 rounded-xl border-2 border-border hover:border-foreground transition-all">Learn More</a>
    </div>
  </div>
</section>
```

### **Feature Grid**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors">
    <div className="text-2xl mb-3">⚡</div>
    <h3 className="font-semibold mb-2">Feature Title</h3>
    <p className="text-sm text-muted-foreground">Feature description</p>
  </div>
</div>
```

### **When to Use Glass vs Solid**

**Use Solid (Most Cases):**
- Forms, editors, data tables
- Primary content areas
- Critical dialogs and modals
- When readability is priority
- High-density information

**Use Glass (Sparingly):**
- Floating panels and popovers
- Dropdown menus
- Tooltips and overlays
- Secondary/decorative UI
- Marketing hero sections (optional)

### **App Type Presets**

**Dashboard/Analytics:**
- Clean white cards with subtle borders
- Monochrome color scheme
- Clear data visualization

**SaaS Landing:**
- Large hero section
- Feature grid with icons
- Social proof section
- Clear CTAs

**Portfolio/Showcase:**
- Image-heavy with good spacing
- Minimal text
- Focus on visuals

**E-commerce:**
- Product grids
- Large product images
- Clear pricing and CTAs

### **Quick Tips**

✅ **DO:**
- Use generous whitespace
- Keep colors minimal (black/white/gray)
- Make buttons large and clickable
- Test in both light and dark modes
- Use proper heading hierarchy
- Add subtle hover states

❌ **DON'T:**
- Overcrowd elements
- Use multiple bright colors
- Make text too small
- Skip mobile responsiveness
- Forget focus states
- Use glass everywhere
