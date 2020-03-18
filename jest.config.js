module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
      tsConfig: 'tsconfig.test.json',
    },
  },
};
