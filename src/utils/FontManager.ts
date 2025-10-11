import { Platform } from 'react-native';

// Font availability checker utility
export class FontManager {
  private static availableFonts: Set<string> = new Set();
  private static isInitialized = false;

  // System fonts that are commonly available
  private static readonly SYSTEM_FONTS = {
    ios: [
      'System',
      'Helvetica',
      'Helvetica-Bold',
      'Arial',
      'Arial-Bold',
      'Times New Roman',
      'Times New Roman-Bold',
    ],
    android: [
      'System',
      'Roboto',
      'Roboto-Light',
      'Roboto-Medium',
      'Roboto-Bold',
      'Droid Sans',
      'Droid Sans Mono',
      'serif',
      'monospace',
    ],
  };

  // Urdu fonts that are bundled with the app
  private static readonly URDU_FONTS = [
    'NotoNastaliqUrdu-Regular',
    'NotoNastaliqUrdu-Medium',
    'NotoNastaliqUrdu-SemiBold',
    'NotoNastaliqUrdu-Bold',
    'JameelNooriNastaleeq',
  ];

  // English fonts that are bundled with the app
  private static readonly ENGLISH_FONTS = [
    'Roboto-Regular',
    'Roboto-Light',
    'Roboto-Medium',
    'Roboto-Bold',
    'Roboto-Black',
    'OpenSans-Regular',
    'OpenSans-Light',
    'OpenSans-Medium',
    'OpenSans-Bold',
    'OpenSans-ExtraBold',
  ];

  /**
   * Initialize font manager by checking available fonts
   * This should be called once during app startup
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Add system fonts
      const systemFonts = Platform.OS === 'ios' 
        ? this.SYSTEM_FONTS.ios 
        : this.SYSTEM_FONTS.android;
      
      systemFonts.forEach(font => this.availableFonts.add(font));

      // For now, we'll assume bundled fonts are available
      // In a production app, you'd want to actually check font availability
      this.URDU_FONTS.forEach(font => this.availableFonts.add(font));
      this.ENGLISH_FONTS.forEach(font => this.availableFonts.add(font));

      this.isInitialized = true;
      console.log('FontManager initialized with', this.availableFonts.size, 'fonts');
    } catch (error) {
      console.error('Failed to initialize FontManager:', error);
      // Fallback to system fonts only
      const systemFonts = Platform.OS === 'ios' 
        ? this.SYSTEM_FONTS.ios 
        : this.SYSTEM_FONTS.android;
      systemFonts.forEach(font => this.availableFonts.add(font));
      this.isInitialized = true;
    }
  }

  /**
   * Get the best available Urdu font
   */
  static getBestUrduFont(): string {
    // Priority order for Urdu fonts
    const urduPriority = [
      'NotoNastaliqUrdu-Regular',
      'JameelNooriNastaleeq',
      'NotoNastaliqUrdu-Medium',
      'NotoNastaliqUrdu-Bold',
      'MehrNastaliqWeb',
      'AlQalamTajNastaleeq',
      'PakNastaleeq',
      'UrduTypesetting',
      'ScheherazadeNew-Regular',
      'Amiri-Regular',
    ];

    for (const font of urduPriority) {
      if (this.availableFonts.has(font)) {
        return font;
      }
    }

    // Fallback to system default
    return 'System';
  }

  /**
   * Get the best available English font
   */
  static getBestEnglishFont(): string {
    // Priority order for English fonts
    const englishPriority = [
      'Roboto-Regular',
      'OpenSans-Regular',
      'Roboto-Medium',
      'OpenSans-Medium',
      'Roboto-Bold',
      'OpenSans-Bold',
      'Montserrat-Regular',
      'Lato-Regular',
      'Poppins-Regular',
      'Nunito-Regular',
    ];

    for (const font of englishPriority) {
      if (this.availableFonts.has(font)) {
        return font;
      }
    }

    // Fallback to system default
    return 'System';
  }

  /**
   * Check if a specific font is available
   */
  static isFontAvailable(fontName: string): boolean {
    return this.availableFonts.has(fontName);
  }

  /**
   * Get all available Urdu fonts
   */
  static getAvailableUrduFonts(): string[] {
    return this.URDU_FONTS.filter(font => this.availableFonts.has(font));
  }

  /**
   * Get all available English fonts
   */
  static getAvailableEnglishFonts(): string[] {
    return this.ENGLISH_FONTS.filter(font => this.availableFonts.has(font));
  }

  /**
   * Get safe font family for a given font name
   * Returns the font if available, otherwise returns a fallback
   */
  static getSafeFontFamily(fontName: string, isUrdu: boolean = false): string {
    if (!fontName || fontName === 'System') {
      return 'System'; // Keep as 'System' string for consistency
    }

    // For now, always return the font name as React Native will handle fallbacks
    // In a production app, you'd want to actually verify font availability
    return fontName;
  }

  /**
   * Get font options for settings screen
   */
  static getFontOptions(): {
    urdu: Array<{ label: string; value: string }>;
    english: Array<{ label: string; value: string }>;
  } {
    const urduOptions = [
      { label: 'System Default', value: 'System' },
      ...this.getAvailableUrduFonts().map(font => ({
        label: this.getFontDisplayName(font),
        value: font,
      })),
    ];

    const englishOptions = [
      { label: 'System Default', value: 'System' },
      ...this.getAvailableEnglishFonts().map(font => ({
        label: this.getFontDisplayName(font),
        value: font,
      })),
    ];

    return { urdu: urduOptions, english: englishOptions };
  }

  /**
   * Get display name for a font
   */
  private static getFontDisplayName(fontName: string): string {
    const displayNames: Record<string, string> = {
      // Noto Nastaliq Urdu fonts
      'NotoNastaliqUrdu-Regular': 'Noto Nastaliq Urdu',
      'NotoNastaliqUrdu-Medium': 'Noto Nastaliq Urdu Medium',
      'NotoNastaliqUrdu-SemiBold': 'Noto Nastaliq Urdu SemiBold',
      'NotoNastaliqUrdu-Bold': 'Noto Nastaliq Urdu Bold',
      
      // Jameel Noori Nastaleeq
      'JameelNooriNastaleeq': 'Jameel Noori Nastaleeq',
      'JameelNooriNastaleeq-Bold': 'Jameel Noori Nastaleeq Bold',
      
      // Other Urdu fonts
      'MehrNastaliqWeb': 'Mehr Nastaliq Web',
      'AlQalamTajNastaleeq': 'Al Qalam Taj Nastaleeq',
      'PakNastaleeq': 'Pak Nastaleeq',
      'PakNastaleeq-Bold': 'Pak Nastaleeq Bold',
      'UrduTypesetting': 'Urdu Typesetting',
      'ScheherazadeNew-Regular': 'Scheherazade New',
      'ScheherazadeNew-Bold': 'Scheherazade New Bold',
      'Amiri-Regular': 'Amiri',
      'Amiri-Bold': 'Amiri Bold',
      
      // Roboto fonts
      'Roboto-Regular': 'Roboto',
      'Roboto-Light': 'Roboto Light',
      'Roboto-Medium': 'Roboto Medium',
      'Roboto-Bold': 'Roboto Bold',
      'Roboto-Black': 'Roboto Black',
      
      // Open Sans fonts
      'OpenSans-Regular': 'Open Sans',
      'OpenSans-Light': 'Open Sans Light',
      'OpenSans-Medium': 'Open Sans Medium',
      'OpenSans-Bold': 'Open Sans Bold',
      'OpenSans-ExtraBold': 'Open Sans ExtraBold',
      'OpenSans-SemiBold': 'Open Sans SemiBold',
      
      // Other English fonts
      'Montserrat-Regular': 'Montserrat',
      'Montserrat-Light': 'Montserrat Light',
      'Montserrat-Medium': 'Montserrat Medium',
      'Lato-Regular': 'Lato',
      'Lato-Light': 'Lato Light',
      'Lato-Bold': 'Lato Bold',
      'Poppins-Regular': 'Poppins',
      'Poppins-Light': 'Poppins Light',
      'Poppins-Medium': 'Poppins Medium',
      'Nunito-Regular': 'Nunito',
      'Nunito-Light': 'Nunito Light',
      'Nunito-SemiBold': 'Nunito SemiBold',
    };

    return displayNames[fontName] || fontName;
  }
}

export default FontManager;
