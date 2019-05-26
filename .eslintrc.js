module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'no-undef': 'off',
    'comma-dangle': ['error', { functions: 'ignore' }],
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'prefer-destructuring': 'off'
  }
};
