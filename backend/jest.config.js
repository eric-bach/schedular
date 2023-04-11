module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', 'lib/graphql/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
