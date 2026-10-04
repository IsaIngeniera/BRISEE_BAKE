/**
 * Jest configuration for Next.js 16 + React 19 frontend.
 * Setup para pruebas unitarias con React Testing Library.
 */

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  displayName: 'Frontend QA Tests',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/qa-unit/**/*.qa-spec.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/qa-unit/jest.setup.ts'],
  moduleNameMapper: {
    // Styles CSS Modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Static assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$':
      '<rootDir>/test/qa-unit/__mocks__/fileMock.js',
    // Alias de Next.js (@/* -> src/*)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2023',
          strictNullChecks: true,
          noImplicitAny: false,
          skipLibCheck: true,
          resolvePackageJsonExports: false,
          isolatedModules: false,
          paths: {
            '@/*': ['./src/*'],
          },
          baseUrl: '.',
        },
        isolatedModules: false,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.module.css',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
  ],
  coverageDirectory: '<rootDir>/test/qa-unit/coverage',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules'],
};
