/* eslint-disable */
/**
 * Jest setup file - runs before each test file.
 * Agrega matchers de React Testing Library.
 */

import '@testing-library/jest-dom';

// Mock de next/image que renderiza un <img> plano
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return require('react').createElement('img', props);
  },
}));

// Mock de next/link que renderiza un <a>
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock del localStorage y sessionStorage por si están cambiando entre tests
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
