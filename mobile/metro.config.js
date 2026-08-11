const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force resolve expo-av if it's being stubborn
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-av': require('path').resolve(__dirname, 'node_modules/expo-av'),
};

module.exports = config;
