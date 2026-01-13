export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['database', 'ui', 'blog', 'origin', 'root']],
  },
};
