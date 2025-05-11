import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,

  rules: {
    'style/brace-style': ['error', '1tbs'],
  },

  lessOpinionated: true,
})
