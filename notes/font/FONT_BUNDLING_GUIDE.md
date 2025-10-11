# Font Bundling Guide

## Quick Setup for Production Fonts

### Step 1: Download Required Fonts

Download these 4 fonts only:

**English Fonts:**
1. **Roboto-Regular.ttf** - https://fonts.google.com/specimen/Roboto
2. **OpenSans-Regular.ttf** - https://fonts.google.com/specimen/Open+Sans

**Urdu Fonts:**
1. **NotoNastaliqUrdu-Regular.ttf** - https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu
2. **JameelNooriNastaleeq.ttf** - Download from urdufonts.net

### Step 2: Add to Android

1. Create fonts directory:
   ```bash
   mkdir -p android/app/src/main/assets/fonts
   ```

2. Copy font files:
   ```bash
   cp Roboto-Regular.ttf android/app/src/main/assets/fonts/
   cp OpenSans-Regular.ttf android/app/src/main/assets/fonts/
   cp NotoNastaliqUrdu-Regular.ttf android/app/src/main/assets/fonts/
   cp JameelNooriNastaleeq.ttf android/app/src/main/assets/fonts/
   ```

### Step 3: Add to iOS

1. Open Xcode: `ios/NauhaArchiveApp.xcworkspace`
2. Drag all 4 font files into the project
3. Update `Info.plist`:
   ```xml
   <key>UIAppFonts</key>
   <array>
     <string>Roboto-Regular.ttf</string>
     <string>OpenSans-Regular.ttf</string>
     <string>NotoNastaliqUrdu-Regular.ttf</string>
     <string>JameelNooriNastaleeq.ttf</string>
   </array>
   ```

### Step 4: Test Fonts

1. Build and run the app
2. Go to Settings → Typography
3. Test both English and Urdu font selection
4. Check that fonts are applied in kalaam display

## Font File Names (Exact)

- `Roboto-Regular.ttf`
- `OpenSans-Regular.ttf` 
- `NotoNastaliqUrdu-Regular.ttf`
- `JameelNooriNastaleeq.ttf`

## Troubleshooting

### Fonts Not Working
- Check file names match exactly (case-sensitive)
- Verify files are in correct directories
- Restart app after adding fonts
- Check console for font loading errors

### Performance
- Only 4 fonts total for optimal performance
- System fonts as fallback
- FontManager handles graceful degradation
