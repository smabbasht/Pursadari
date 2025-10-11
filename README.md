# Pursadari 📱

**A comprehensive offline-first mobile application for accessing and managing Shia religious content, with a focus on Kalaam, Nohas, and religious texts.**

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-green.svg)](https://sqlite.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.0+-orange.svg)](https://firebase.google.com/)

## 🌟 Overview

Pursadari is a modern, offline-first mobile application designed to provide seamless access to Shia religious content. Built with React Native and TypeScript, it prioritizes offline functionality while maintaining sync capabilities for collaborative content management.

## ✨ Key Features

### 🔄 **Offline-First Architecture**
- **Complete offline functionality** - Access all content without internet connection
- **Local SQLite database** for fast, reliable data storage
- **Smart sync system** - Updates when connection is available
- **Background sync** - Automatic content updates when online
- **One sync per day** - Optimized for battery and data usage

### 📚 **Comprehensive Content Management**
- **Kalaam & Nohas** - Extensive collection of religious poetry and recitations
- **Multi-language support** - Arabic, Urdu, and English content
- **Advanced search** - Search by title, lyrics, poet, reciter, or masaib
- **Priority-based search** - Title matches first, then lyrics
- **Streaming search results** - Real-time search with progressive loading

### 🎵 **Rich Media Experience**
- **YouTube integration** - Embedded video content
- **Custom fonts** - Support for Arabic, Urdu, and English typography
- **Theme support** - Light and dark mode with custom accent colors
- **High-quality audio** - Optimized for religious recitations

### ⭐ **Personalization**
- **Favorites system** - Save and organize preferred content
- **Pin functionality** - Pin up to 3 items for quick access
- **Special content** - Auto-favorited and pinned religious texts (Hadees e Kisa, Ziyarat Ashura)
- **Custom fonts** - Choose from multiple Arabic and Urdu font families
- **Font sizing** - Adjustable text size for better readability

### 🔍 **Advanced Search & Discovery**
- **Multi-language search** - Search in Urdu, English, or Arabic
- **Roman script support** - Search Urdu content using English characters
- **Smart suggestions** - Context-aware search recommendations
- **Search guidance** - Built-in help for effective searching

## 🏗️ Technical Architecture

### **Frontend**
- **React Native 0.72+** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Smooth navigation experience
- **React Native Vector Icons** - Comprehensive icon library
- **React Native SQLite Storage** - Local database management

### **Backend & Sync**
- **Firebase Firestore** - Cloud database for content management
- **SQLite** - Local database for offline storage
- **Custom sync engine** - Intelligent data synchronization
- **Background sync** - Automatic content updates
- **Conflict resolution** - Smart handling of data conflicts

### **Database Schema**
```sql
-- Core content table
CREATE TABLE kalaam (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  lyrics_urdu TEXT,
  lyrics_eng TEXT,
  poet TEXT,
  reciter TEXT,
  masaib TEXT,
  yt_link TEXT,
  created_at DATETIME,
  last_modified TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE
);

-- User preferences
CREATE TABLE favourites (kalaam_id INTEGER PRIMARY KEY, created_at DATETIME);
CREATE TABLE pins (kalaam_id INTEGER PRIMARY KEY, created_at DATETIME);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME);
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase project setup

### **Installation**
```bash
# Clone the repository
git clone https://github.com/smabbasht/Pursadari.git
cd Pursadari

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Android setup
# Ensure Android SDK is properly configured

# Run the application
npm run android  # For Android
npm run ios      # For iOS
```

### **Environment Setup**
1. **Firebase Configuration**
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/NauhaArchiveApp/`
   - Configure Firebase project with Firestore

2. **Database Initialization**
   - App automatically creates local SQLite database
   - Initial sync populates content from Firebase
   - Offline functionality available immediately

## 🤝 Contributing

**Pursadari is an open-source project that welcomes contributions from the community.**

### **How to Contribute**
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Contribution Guidelines**
- **Code Style**: Follow TypeScript and React Native best practices
- **Testing**: Ensure all changes work on both Android and iOS
- **Documentation**: Update README and code comments as needed
- **Religious Content**: Maintain respect and accuracy for religious content
- **Offline-First**: Ensure all features work offline

### **Areas for Contribution**
- **Content Management**: Help add and organize religious content
- **Translation**: Assist with multi-language support
- **UI/UX**: Improve user interface and experience
- **Performance**: Optimize app performance and battery usage
- **Testing**: Help test on various devices and scenarios
- **Documentation**: Improve project documentation

## 📱 Screenshots

*Screenshots will be added showing the app's interface, search functionality, and offline capabilities.*

## 🔧 Development

### **Project Structure**
```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
├── services/           # Business logic and API services
├── database/           # SQLite database management
├── context/            # React context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### **Key Services**
- **Database.ts** - SQLite database operations
- **SyncManager.ts** - Content synchronization
- **FavoritesService.ts** - User preferences management
- **NotificationService.ts** - Push notifications
- **FontManager.ts** - Typography management

### **Build & Deployment**
```bash
# Android release build
cd android && ./gradlew assembleRelease

# iOS release build
# Use Xcode to build and archive
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Community Contributors** - For their valuable contributions
- **Religious Scholars** - For content guidance and accuracy
- **Open Source Libraries** - For the tools that make this possible
- **Beta Testers** - For feedback and improvement suggestions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/smabbasht/Pursadari/issues)
- **Discussions**: [GitHub Discussions](https://github.com/smabbasht/Pursadari/discussions)
- **Email**: [Contact Information]

## 🔮 Roadmap

- [ ] **Enhanced Search** - AI-powered content recommendations
- [ ] **Audio Player** - Built-in audio playback functionality
- [ ] **Social Features** - Community sharing and discussions
- [ ] **Advanced Theming** - More customization options
- [ ] **Accessibility** - Enhanced accessibility features
- [ ] **Performance** - Further optimization and speed improvements

---

**Built with ❤️ for the Shia community**

*Pursadari - Your offline companion for religious content*