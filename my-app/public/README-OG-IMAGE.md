# WhatsApp OG Image Requirements

Based on WhatsApp official documentation, create an optimized image for perfect previews:

## WhatsApp Specific Requirements:
- **Filename**: `og-image-whatsapp.jpg`
- **Dimensions**: 600px × 315px (or larger, maintaining 1.9:1 ratio)
- **Max Aspect Ratio**: 4:1 width/height or less
- **Min Width**: 300px or more
- **File Size**: Under 600KB (WhatsApp requirement)
- **Format**: JPEG or PNG

## Design Guidelines:
1. **Safe Area**: Keep important content 80px from edges
2. **Logo Placement**: Center the logo with contain/fit (no cropping)
3. **Background**: Use gradient or solid color that matches theme
4. **Text**: Include "WISUDA LPK SAMIT" and "第11回サミットの卒業式"
5. **Quality**: High quality, clear and readable

## WhatsApp Optimized Layout (600×315):
```
┌─────────────────────────────────────┐
│  [30px safe padding]                │
│                                     │
│     [Logo - centered, contained]    │
│                                     │
│    第11回サミットの卒業式            │
│    WISUDA LPK SAMIT                 │
│                                     │
│  [30px safe padding]                │
└─────────────────────────────────────┘
```

## Alternative Large Format (1200×630):
For better quality, you can also create a larger version that meets WhatsApp requirements.

## Colors to Use:
- Background: Linear gradient (#1e3c72 to #2a5298)
- Text: White (#ffffff)
- Logo: Original colors with drop shadow

## WhatsApp Testing Instructions:

### After Creating the Image:
1. Save as `og-image-whatsapp.jpg` in `/public` folder
2. Test with: https://www.opengraph.xyz/
3. Verify WhatsApp preview by composing (not sending) a message with the link
4. Wait 10 seconds for preview to appear
5. If no preview, check all requirements above

### WhatsApp User-Agent:
WhatsApp crawls with User-Agent: `WhatsApp/2.x.x.x A|I|N`
- A = Android, I = iOS, N = Web

### Cache Busting:
Add `?v=2` to URL when sharing if you need to refresh WhatsApp's cache.

### File Size Check:
Keep image under 600KB as per WhatsApp requirements!

This will ensure perfect WhatsApp previews without cropping!