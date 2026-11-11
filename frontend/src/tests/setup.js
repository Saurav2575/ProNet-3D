import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import '@testing-library/jest-dom';
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
