import { Button } from '@renderer/components/ui/button'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Electron + React + shadcn/ui</h1>
      <div className="flex gap-2">
        <Button onClick={ipcHandle}>Send IPC</Button>
        <Button variant="outline" onClick={() => window.open('https://electron-vite.org/')}>
          Documentation
        </Button>
      </div>
    </div>
  )
}

export default App
