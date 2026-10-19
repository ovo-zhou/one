/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        webview: DetailedHTMLProps<HTMLAttributes<Electron.WebviewTag>, Electron.WebviewTag> & {
          src: string
        }
      }
    }
  }
}
