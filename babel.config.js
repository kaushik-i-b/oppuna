module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Zustand ESM (and similar) use import.meta; Metro web serves a classic script.
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      // react-native-worklets/plugin must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
