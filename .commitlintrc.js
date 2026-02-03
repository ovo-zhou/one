export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', ['local-index', 'client-ui', 'blog', 'origin', 'root']],
  },
};
