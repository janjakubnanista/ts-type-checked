module.exports =  {
  parser:  '@typescript-eslint/parser', // Specifies the ESLint parser
  extends:  [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended',
  ],
  plugins: [
    'sort-imports-es6-autofix',
  ],
  parserOptions:  {
    ecmaVersion:  2018, // Allows for the parsing of modern ECMAScript features
    sourceType:  'module', // Allows for the use of imports
    ecmaFeatures:  {
      jsx:  true,
    },
  },
  overrides: [{
    files: ['*.js', '*.jsx'],
    rules: {
      // And as mentioned here this rule will freak out on .js files as well
      // https://github.com/typescript-eslint/typescript-eslint/issues/906
      //
      // So we disable it for .js files using overrides
      '@typescript-eslint/explicit-function-return-type': 0,

      // And the same goes for member accessibility
      //
      // See https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-member-accessibility.md
      '@typescript-eslint/explicit-member-accessibility': 0,

      // And last but not least require() calls are enabled in js files
      '@typescript-eslint/no-var-requires': 0
    }
  }, {
    files: ['test/**/*.spec.ts', 'test/**/*.spec.tsx'],
    rules: {
      "@typescript-eslint/ban-ts-ignore": 0
    }
  }],
  rules:  {
    // Prevent forgotten console.* statements
    "no-console": 1,

    // Make sure imports get sorted
    "sort-imports-es6-autofix/sort-imports-es6": [2, {
      "ignoreCase": false,
      "ignoreMemberSort": false,
      "memberSyntaxSortOrder": ["none", "all", "multiple", "single"]
    }],

    // A special case in which to ignore camelcase found in rollup.config.js
    "@typescript-eslint/camelcase": [1, {
      "allow": ["screw_ie8"]
    }],

    "@typescript-eslint/no-use-before-define": [1, { "functions": false }],

    "@typescript-eslint/explicit-function-return-type": 0
  },
  settings:  {
    "import/resolver": {
      node: {
        extensions: [".ts", ".js"]
      }
    }
  },
};