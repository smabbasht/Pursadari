# Pursadari App - Folder Structure Documentation

## Root Directory Structure

```
Pursadari/
├── src/                    # Main source code
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
├── assets/                 # Static assets (images, fonts)
├── notes/                  # Development documentation
├── learn/                  # Learning documentation (this folder)
├── app-script/             # Google Apps Script automation
├── __tests__/             # Test files
├── App.tsx                 # Main app entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro bundler configuration
└── react-native.config.js  # React Native configuration
```

## Detailed Folder Breakdown

### 📁 `src/` - Main Source Code
**Purpose**: Contains all the main application code, organized by functionality.

**React Native Perspective**: This is the heart of your React Native app. Unlike web development where you might have separate folders for different concerns, React Native apps typically organize code by feature or type.

```
src/
├── components/     # Reusable UI components
├── screens/        # App screens (pages)
├── services/       # Business logic and API calls
├── database/       # Database operations
├── context/        # React Context providers
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

### 📁 `src/components/` - Reusable UI Components
**Purpose**: Contains reusable UI components that can be used across multiple screens.

**React Native Perspective**: Components are the building blocks of React Native apps. They're like custom HTML elements but for mobile. Each component can have its own state, props, and lifecycle methods.

**Key Concepts**:
- **Reusability**: Write once, use anywhere
- **Props**: Data passed from parent to child
- **State**: Internal component data
- **Lifecycle**: Component mounting, updating, unmounting

### 📁 `src/screens/` - App Screens
**Purpose**: Contains the main screens/pages of the app. Each screen represents a different view in your app.

**React Native Perspective**: Screens are like pages in a web app, but optimized for mobile. They handle navigation, user interactions, and data display.

**Key Concepts**:
- **Screen Components**: Full-screen React components
- **Navigation**: Moving between screens
- **Props**: Data passed from navigation
- **State Management**: Local and global state

### 📁 `src/services/` - Business Logic
**Purpose**: Contains business logic, API calls, and external service integrations.

**React Native Perspective**: Services handle the "business" part of your app - data fetching, processing, and external integrations. They're separate from UI components to keep code organized.

**Key Concepts**:
- **Separation of Concerns**: Logic separate from UI
- **Async Operations**: Handling promises and async/await
- **Error Handling**: Managing failures gracefully
- **Singleton Pattern**: Single instance services

### 📁 `src/database/` - Database Operations
**Purpose**: Contains all database-related code, including SQLite operations and data models.

**React Native Perspective**: Unlike web apps that use REST APIs, mobile apps often use local databases for offline functionality. SQLite is the most common choice for React Native.

**Key Concepts**:
- **Local Database**: SQLite for offline storage
- **CRUD Operations**: Create, Read, Update, Delete
- **Transactions**: Ensuring data consistency
- **Migrations**: Database schema updates

### 📁 `src/context/` - React Context
**Purpose**: Contains React Context providers for global state management.

**React Native Perspective**: Context is React's way of sharing data between components without prop drilling. It's like a global state manager.

**Key Concepts**:
- **Global State**: Shared data across components
- **Providers**: Components that provide context
- **Consumers**: Components that use context
- **Hooks**: useContext for accessing context

### 📁 `src/types/` - TypeScript Types
**Purpose**: Contains TypeScript type definitions and interfaces.

**React Native Perspective**: TypeScript adds type safety to JavaScript. Types help catch errors at compile time and make code more maintainable.

**Key Concepts**:
- **Type Safety**: Catching errors before runtime
- **Interfaces**: Defining object shapes
- **Enums**: Named constants
- **Generics**: Reusable type definitions

### 📁 `src/utils/` - Utility Functions
**Purpose**: Contains helper functions and utilities used throughout the app.

**React Native Perspective**: Utils are helper functions that don't fit into other categories. They're pure functions that can be easily tested and reused.

**Key Concepts**:
- **Pure Functions**: No side effects
- **Reusability**: Used across multiple components
- **Testing**: Easy to unit test
- **Modularity**: Small, focused functions

### 📁 `android/` - Android-Specific Code
**Purpose**: Contains Android-specific configuration and native code.

**React Native Perspective**: React Native apps need platform-specific code for native features. This folder contains Android-specific configurations, permissions, and native modules.

**Key Concepts**:
- **Platform-Specific Code**: Android-only features
- **Native Modules**: Bridge between JavaScript and native code
- **Permissions**: Android app permissions
- **Build Configuration**: Gradle files for Android builds

### 📁 `ios/` - iOS-Specific Code
**Purpose**: Contains iOS-specific configuration and native code.

**React Native Perspective**: Similar to Android, this folder contains iOS-specific configurations, Info.plist settings, and native modules.

**Key Concepts**:
- **Platform-Specific Code**: iOS-only features
- **Native Modules**: Bridge between JavaScript and native code
- **Info.plist**: iOS app configuration
- **Build Configuration**: Xcode project files

### 📁 `assets/` - Static Assets
**Purpose**: Contains images, fonts, and other static resources.

**React Native Perspective**: Assets are bundled with your app and can be accessed at runtime. They're optimized for mobile devices.

**Key Concepts**:
- **Asset Bundling**: Resources included in app bundle
- **Image Optimization**: Different sizes for different devices
- **Font Loading**: Custom fonts for better typography
- **Asset Management**: Organizing and accessing resources

### 📁 `notes/` - Development Documentation
**Purpose**: Contains development notes, database schemas, and implementation details.

**React Native Perspective**: Good documentation is crucial for maintaining React Native apps. This folder contains technical documentation for developers.

**Key Concepts**:
- **Documentation**: Keeping track of decisions and implementations
- **Database Schema**: Understanding data structure
- **Sync Strategy**: How data synchronization works
- **Development Notes**: Important implementation details

### 📁 `app-script/` - Google Apps Script
**Purpose**: Contains Google Apps Script code for automation and data processing.

**React Native Perspective**: This is backend automation code that runs on Google's servers. It's not part of the React Native app but supports it.

**Key Concepts**:
- **Backend Automation**: Server-side processing
- **Data Processing**: Batch operations
- **Google Services**: Integration with Google APIs
- **Scheduling**: Automated tasks

### 📁 `__tests__/` - Test Files
**Purpose**: Contains unit tests and integration tests.

**React Native Perspective**: Testing is crucial for React Native apps. Tests help ensure your app works correctly and prevent regressions.

**Key Concepts**:
- **Unit Tests**: Testing individual functions
- **Integration Tests**: Testing component interactions
- **Jest**: Testing framework used by React Native
- **Test Coverage**: Ensuring all code is tested

## File Organization Best Practices

### 1. **Feature-Based Organization**
```
src/
├── features/
│   ├── search/
│   │   ├── components/
│   │   ├── screens/
│   │   └── services/
│   └── favorites/
│       ├── components/
│       └── screens/
```

### 2. **Type-Based Organization** (Current)
```
src/
├── components/     # All reusable components
├── screens/        # All screens
├── services/       # All business logic
└── utils/          # All utilities
```

### 3. **Hybrid Organization**
```
src/
├── shared/         # Shared components and utilities
├── features/       # Feature-specific code
└── core/          # Core app functionality
```

## React Native Specific Considerations

### 1. **Platform-Specific Code**
- Use `.ios.tsx` and `.android.tsx` extensions for platform-specific files
- Use `Platform.OS` to conditionally render platform-specific code
- Keep platform-specific code in separate folders

### 2. **Asset Management**
- Use `require()` for static assets
- Optimize images for different screen densities
- Use vector icons for scalable graphics

### 3. **Navigation Structure**
- Keep navigation logic separate from screen components
- Use TypeScript for navigation types
- Implement proper navigation patterns

### 4. **State Management**
- Use Context for global state
- Keep local state in components
- Use custom hooks for shared logic

## Common Patterns in Your App

### 1. **Service Layer Pattern**
- Database operations in `src/database/`
- Business logic in `src/services/`
- Clear separation between data and UI

### 2. **Context Pattern**
- Global settings in `src/context/SettingsContext.tsx`
- Theme management with custom hooks
- Font configuration and management

### 3. **Component Composition**
- Reusable components in `src/components/`
- Screen components in `src/screens/`
- Clear separation of concerns

### 4. **Type Safety**
- Type definitions in `src/types/`
- Interface definitions for data structures
- Type-safe navigation and props

## Next Steps

Now that you understand the folder structure, the next documentation will cover:

1. **Individual Files** - Detailed explanation of each file
2. **React Native Concepts** - How each concept is implemented
3. **Code Patterns** - Common patterns used throughout the app
4. **Best Practices** - React Native development guidelines

Each file documentation will include:
- **Purpose**: What the file does for the app
- **React Native Perspective**: How it works in React Native
- **Key Concepts**: Important React Native concepts used
- **Code Examples**: How the code works
- **Best Practices**: React Native development guidelines
