/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: process.env.CI || process.argv.includes('--coverage'),
  collectCoverageFrom: ['src/**/*.ts', '!src/cli.ts'],
  coverageThreshold: {
    global: {
      branches: 73.5,
      functions: 90,
      lines: 80,
      statements: 80
    },
    // Per-file thresholds to catch individual files with poor coverage
    './src/**/!(*.test|*.spec|cli).ts': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    '^.+\\.js$': ['ts-jest', { useESM: true }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(env-paths|is-safe-filename)/)'
  ]
};
