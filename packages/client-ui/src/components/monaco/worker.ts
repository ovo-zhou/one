import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

/**
 * 这是 Monaco 环境配置的核心
 * 它定义了如何在 Worker 线程中创建不同语言的编辑器 Worker
 * 每个 Worker 负责处理一种语言的编辑操作，如语法高亮、自动完成等
 * 这个配置确保了在编辑器中使用不同语言时，每个语言都有一个独立的 Worker 线程来处理
 * 这有助于提高编辑器的性能和响应速度，因为每个 Worker 线程都是独立的 JavaScript 环境
 * 
 * 原理
 * 这里的 self 实际上指向window对象
 * 在 window 对象上挂载 MonacoEnvironment 配置
 * 当 Monaco 编辑器需要创建一个新的 Worker 线程时，它会调用这个配置的 getWorker 方法
 * getWorker 方法根据语言标签（label）返回一个新的 Worker 实例
 */
self.MonacoEnvironment = {
  getWorker(_, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};