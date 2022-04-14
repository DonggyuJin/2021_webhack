import replace from '@rollup/plugin-replace';

export default {
  input: 'index.js',
  output: {
    dir: 'output',
    format: 'cjs',
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.browser': true,
      'process.env.NODE_ENV': JSON.stringify(mode),
      __buildDate__: () => JSON.stringify(new Date()),
      __buildVersion: 15,
      'process.env.DEBUG': true,
    }),
  ],
};