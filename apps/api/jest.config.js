/**
 * Konfiguracja testów jednostkowych API (NestJS).
 * Wzorzec układu z naszego drugiego projektu (NestJS+Prisma): testy obok kodu
 * jako `*.spec.ts`, ts-jest, mapper aliasu `@/*` → `src/*` zgodny z tsconfig.
 * Config jako `.js`, by parser jest nie wymagał ts-node w monorepo.
 */
/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
