module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@ui': './src/shared/components/ui',
            '@features': './src/features',
            '@shared': './src/shared',
            '@assets': './assets',

            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
