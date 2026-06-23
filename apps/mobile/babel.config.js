// babel-preset-expo includes the expo-router and React Native transforms for SDK 56.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
