export interface IBridge {
  ping: () => void,
}

declare global {
  interface Window {
    bridge: IBridge
  }
}