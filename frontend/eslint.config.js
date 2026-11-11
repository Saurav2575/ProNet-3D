import js from '@eslint/js';
import globals from 'globals';
export default [{ ignores: ['node_modules/**', 'dist/**', 'coverage/**'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node, ...globals.jest } }, rules: { 'no-unused-vars': 'off' } }];
