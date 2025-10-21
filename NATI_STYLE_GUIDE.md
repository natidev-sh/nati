# 🎨 Nati Style Guide

## Design Philosophy
Premium, modern, and sophisticated design language with:
- **Animated mesh gradients** - Floating orbs for depth
- **Glass morphism** - Frosted glass surfaces with backdrop blur
- **Framer Motion animations** - Smooth, spring-based micro-interactions
- **Gradient accents** - Indigo → Purple → Pink throughout
- **Premium spacing** - Generous padding and rounded corners (2xl/3xl)
- **Pulsing indicators** - Subtle animations for status
- **Staggered entrances** - Sequential reveals with delays

## Color Palette
```css
Primary Gradient: from-indigo-500 via-purple-500 to-pink-500
Status Green: emerald-500 (with pulse animation)
Glass Surface: backdrop-blur-2xl with white/20 borders
Shadows: shadow-2xl with color/50 opacity
```

## Component Patterns

### Cards
```tsx
<motion.div
  whileHover={{ scale: 1.03, y: -4 }}
  whileTap={{ scale: 0.98 }}
  className="rounded-2xl p-5 glass-surface border border-white/20 dark:border-white/10"
>
  {/* Gradient hover effect */}
  <motion.div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100" />
  {/* Content */}
</motion.div>
```

### Buttons
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25"
/>
```

### Badges
```tsx
<motion.span
  whileHover={{ scale: 1.1 }}
  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20"
/>
```

### Empty States
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
>
  {/* Animated gradient orbs */}
  <div className="absolute inset-0 -z-10 overflow-hidden opacity-30">
    <motion.div
      animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 8, repeat: Infinity }}
      className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl"
    />
  </div>
  {/* Content with rotating icon */}
</motion.div>
```

### Input Fields
```tsx
{/* Mesh gradient background */}
<div className="absolute -inset-[100px] opacity-30 blur-3xl pointer-events-none">
  <motion.div
    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 8, repeat: Infinity }}
    className="w-96 h-96 bg-gradient-to-br from-indigo-500 via-purple-500 to-transparent rounded-full"
  />
</div>

{/* Glass container */}
<div className="rounded-3xl glass-surface border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-2xl">
  {/* Premium glow on focus */}
  <motion.div 
    animate={{ opacity: hasContent ? 0.3 : 0 }}
    className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl"
  />
</div>
```

### Status Indicators
```tsx
<motion.div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface border border-emerald-500/20">
  <motion.div
    className="w-2 h-2 rounded-full bg-emerald-500"
    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
  <span className="text-xs font-medium text-emerald-500">Status Text</span>
</motion.div>
```

## Animation Timing
- **Fast interactions**: 0.15-0.3s
- **Standard transitions**: 0.4-0.5s  
- **Entrance animations**: Stagger by 0.1s per item
- **Background orbs**: 8-12s infinite loops
- **Pulse effects**: 2s infinite

## Implementation Checklist

### ✅ Completed (Nati Style)
- [x] HomeChatInput
- [x] Recent Apps Section
- [x] Empty State

### 🎯 To Update
- [ ] App Details Page
- [ ] LexicalChatInput (in chat view)
- [ ] MessagesList
- [ ] Settings panels
- [ ] All dialogs/modals

## Quick Reference

**Always include:**
1. Framer Motion `<motion.div>`
2. Gradient orbs in background
3. Glass surface with backdrop-blur
4. Border with white/20 opacity
5. Shadow-2xl or shadow-lg
6. Rounded-2xl or rounded-3xl
7. whileHover and whileTap animations
8. Staggered entrance (delay * index)
9. Gradient hover overlays
10. Status indicators with pulse

**Never:**
- Use sharp corners (min rounded-lg)
- Skip hover animations on interactive elements
- Use solid colors without gradients
- Forget the glass-surface class
- Miss the backdrop-blur

---

This is the premium "Nati Style" that makes the app feel like a $10k product! ✨
