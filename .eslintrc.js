module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  rules: {
    'no-shadow': 0,
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    'jsx-a11y/no-noninteractive-tabindex': 0,
    'no-plusplus': 0,
  },
};
