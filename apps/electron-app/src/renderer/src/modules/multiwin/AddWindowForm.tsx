import { useCallback, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import type { MultiWinConfig } from './ConfigModal'

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface AddWindowFormProps {
  onAdd: (config: MultiWinConfig) => void
  onCancel: () => void
}

export function AddWindowForm({ onAdd, onCancel }: AddWindowFormProps): React.JSX.Element {
  const [url, setUrl] = useState('')
  const [devtools, setDevtools] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleConfirm = useCallback(() => {
    if (!url.trim()) {
      setError(true)
      inputRef.current?.focus()
      return
    }
    onAdd({ id: makeId(), url: url.trim(), devtools })
  }, [url, devtools, onAdd])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/60 p-2">
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setError(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConfirm()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="https://example.com"
        autoFocus
        className={`w-full rounded-md border bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-ring ${
          error ? 'border-destructive' : 'border-border'
        }`}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">DevTools</span>
        <Switch checked={devtools} onCheckedChange={setDevtools} />
        <div className="ml-auto flex gap-1">
          <Button size="icon-xs" variant="ghost" onClick={onCancel}>
            <X className="size-3" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={handleConfirm}>
            <Check className="size-3 text-chart-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
