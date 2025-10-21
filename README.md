# 🎯 NudgePal

> A personal finance and habits tracker mobile app built with React Native and Expo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.13-black.svg)](https://expo.dev/)

## 📱 Features


- 📊 **Dashboard** - Get insights into your spending patterns
- 🎯 **Habit Tracking** - Monitor your daily habits and routines
- 💧 **Hydration Reminders** - Stay hydrated with smart notifications
- 📅 **Calendar View** - Visualize your financial data over time
- 🌍 **Multi-Language Support** - Available in English, French, and Arabic
- 🌙 **Dark Mode** - Eye-friendly interface with automatic theme detection


## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Styling**: React Native built-in styles with linear gradients
- **Storage**: AsyncStorage
- **Notifications**: Expo Notifications

## 📦 Installation

### Prerequisites

- Node.js (v20.19.4 or higher recommended)
- npm or yarn
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nudgepal.git
   cd nudgepal
   ```

2. **Install dependencies**
   ```bash
   npm install --force --legacy-peer-deps
   ```
   > Note: The `--force` and `--legacy-peer-deps` flags are used due to peer dependency version conflicts.

3. **Start the development server**
   ```bash
   npm start
   ```

## 🚀 Running the App

### Development Mode

```bash
# Start the Expo dev server
npm start

# Then choose one of:
# Press 'w' to open web version
# Press 'a' to open Android
# Press 'i' to open iOS
# Scan QR code with Expo Go app
```

### Available Scripts

- `npm start` - Start development server
- `npm run start:clear` - Start with cleared cache
- `npm run start:offline` - Start in offline mode
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

## 📁 Project Structure

```
nudgepal/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BillCard/
│   │   ├── BottomNavigation.tsx
│   │   ├── SharedHeader.tsx
│   │   └── SideMenu.tsx
│   ├── screens/             # App screens/pages
│   │   ├── DashboardScreen.tsx
│   │   ├── MyBillsScreen.tsx
│   │   ├── HabitsScreen.tsx
│   │   ├── HydrationScreen.tsx
│   │   └── ...
│   ├── contexts/            # React Context providers
│   │   ├── AppContext.tsx
│   │   ├── BillsContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/            # Business logic
│   │   ├── billService.ts
│   │   └── adaptiveBudgetService.ts
│   ├── utils/               # Utility functions
│   │   ├── billCalculations.ts
│   │   ├── currencyService.ts
│   │   ├── notificationService.ts
│   │   └── rtlUtils.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useTranslation.ts
│   ├── i18n/                # Internationalization
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── ar.json
│   └── navigation/          # Navigation setup
├── assets/                  # Images, icons, and static files
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## 🌐 Internationalization

NudgePal supports multiple languages:
- 🇬🇧 English
- 🇫🇷 French
- 🇸🇦 Arabic (with RTL support)

Language files are located in `src/i18n/`

## 🎨 Theming

The app supports:
- Light theme
- Dark theme
- Automatic detection based on system settings

## 🔔 Notifications

The app uses Expo Notifications for:
- Bill payment reminders
- Hydration reminders
- Habit tracking notifications

Note: Push notification functionality is limited in Expo Go. For full functionality, use a development build.

## 🐛 Known Issues

- Expo Notifications has limited functionality in Expo Go (SDK 53+). Use a development build for full support.
- Package version warnings for `expo@54.0.13` and `react-native-worklets@0.5.1` - these are minor compatibility warnings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Achraf (CODINXPRO)**

## 📧 Support

For support, reach out to the project maintainers or open an issue on GitHub.

---

**Made with ❤️ for personal and habit tracking**
