// Flat ESLint config (ESLint 9) using Expo's shared rules.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'website/**',
      'scripts/**',
      'plugins/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
    ],
  },
  {
    rules: {
      'import/order': 'off',
    },
  },
];
