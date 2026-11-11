import js from '@eslint/js';
import globals from 'globals';
export default [{ files: ['scripts/browser-test.js'], languageOptions: { globals: globals.browser } }, { ignores: ['node_modules/**', 'uploads/**', 'coverage/**'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$', caughtErrors: 'none' }] } }];
