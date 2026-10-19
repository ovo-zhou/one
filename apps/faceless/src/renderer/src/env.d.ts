/// <reference types="vite/client" />

import type * as React from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        webview: React.DetailedHTMLProps<
          React.HTMLAttributes<Electron.WebviewTag>,
          Electron.WebviewTag
        > & {
          src: string
        }
      }
    }
  }
}
