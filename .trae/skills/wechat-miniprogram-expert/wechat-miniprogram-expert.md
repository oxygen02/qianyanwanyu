---
name: "wechat-miniprogram-expert"
description: "WeChat Mini Program development expert. Use when building WeChat mini programs, handling WeChat API, cloud development, or performance optimization."
---

# WeChat Mini Program Expert

## Purpose
Expert guidance for WeChat Mini Program development, covering best practices, common pitfalls, and optimization strategies.

## When to Use
- Building new WeChat mini programs
- Troubleshooting WeChat-specific issues
- Optimizing mini program performance
- Working with WeChat Cloud Development

## Core Best Practices

### 1. Project Structure
```
miniprogram/
├── pages/           # Page directories
│   ├── index/       # Each page with .wxml, .wxss, .js, .json
│   └── ...
├── components/      # Reusable components
├── utils/           # Utility functions
├── services/        # API services
├── assets/          # Static assets
├── app.js           # App entry
├── app.json         # App config
└── app.wxss         # Global styles
```

### 2. Data Binding
- Use `setData()` wisely (batch updates, avoid frequent calls)
- Consider using `Component` for complex pages (better performance)

### 3. Canvas Performance (Canvas 2D)
```javascript
// Use OffscreenCanvas for complex rendering
const offscreen = wx.createOffscreenCanvas({ type: '2d', width, height })
// Render to offscreen first, then draw to visible canvas
```

### 4. Font Loading
```javascript
wx.loadFontFace({
  family: 'MyFont',
  source: 'url(...)',
  success: () => console.log('Font loaded'),
  fail: (err) => console.error('Failed:', err)
})
```

### 5. Cloud Development
- Use cloud functions for server-side logic
- Implement proper error handling for cloud API calls
- Use transactions for data consistency

### 6. Performance Optimization
- Use `IntersectionObserver` for lazy loading
- Minimize `setData` calls and data size
- Use `wxs` (WeChat Script) for performant computations
- Enable `component2` for smaller component bundles

### 7. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Canvas blurry | Set `type="2d"` and handle DPR scaling |
| Font not loading | Check CORS, use cloud storage fileIDs |
| Memory leak | Clean up timers, event listeners on `onUnload` |
| Slow page load | Use `skeleton` components, code splitting |

### 8. Testing
- Use WeChat DevTools simulation
- Test on real devices for performance issues
- Check WeChat-specific console warnings

## Constraints
- Avoid synchronous API calls where possible
- Don't store sensitive data in `localStorage`
- Follow WeChat content review guidelines

## Expected Output
High-performance, production-ready WeChat mini program code.
