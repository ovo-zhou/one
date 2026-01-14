export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', ['database', 'ui', 'blog', 'origin', 'root']],
  },
};
