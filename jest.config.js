/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/packages/db/node_modules/'
  ],
  collectCoverageFrom: [
    'packages/ui/src/**/*.{js,jsx,ts,tsx}',
    'apps/web/src/**/*.{js,jsx,ts,tsx}',
    'apps/admin/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Pure helper modules should have higher coverage
    'packages/ui/src/lib/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@radhagsareees/ui$': '<rootDir>/packages/ui/src',
    '^@radhagsareees/db$': '<rootDir>/packages/db/src'
  },
  testTimeout: 10000,
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          baseUrl: '.',
          paths: {
            '@/*': ['./apps/web/src/*']
          }
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

module.exports = config;