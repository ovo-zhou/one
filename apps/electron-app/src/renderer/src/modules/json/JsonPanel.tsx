import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JsonView from '@uiw/react-json-view'
import { Tooltip } from '@base-ui/react/tooltip'
import { Check, ChevronsDownUp, ChevronsUpDown, ClipboardPaste, Copy, Eraser } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

type ExpandMode = 'all' | 'none' | number

const THEME: React.CSSProperties = {
  '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
  '--w-rjv-background-color': 'transparent',
  '--w-rjv-color': 'var(--foreground)',
  '--w-rjv-key-string': 'var(--foreground)',
  '--w-rjv-key-number': 'var(--muted-foreground)',
  '--w-rjv-line-color': 'var(--border)',
  '--w-rjv-arrow-color': 'var(--muted-foreground)',
  '--w-rjv-info-color': 'var(--muted-foreground)',
  '--w-rjv-curlybraces-color': 'var(--muted-foreground)',
  '--w-rjv-brackets-color': 'var(--muted-foreground)',
  '--w-rjv-colon-color': 'var(--muted-foreground)',
  '--w-rjv-quotes-color': 'var(--muted-foreground)',
  '--w-rjv-quotes-string-color': 'var(--chart-4)',
  '--w-rjv-type-string-color': 'var(--chart-4)',
  '--w-rjv-type-int-color': 'var(--chart-2)',
  '--w-rjv-type-float-color': 'var(--chart-2)',
  '--w-rjv-type-bigint-color': 'var(--chart-2)',
  '--w-rjv-type-boolean-color': 'var(--chart-5)',
  '--w-rjv-type-null-color': 'var(--destructive)',
  '--w-rjv-type-undefined-color': 'var(--muted-foreground)',
  '--w-rjv-type-date-color': 'var(--chart-1)',
  '--w-rjv-type-url-color': 'var(--chart-3)',
  '--w-rjv-copied-color': 'var(--muted-foreground)',
  '--w-rjv-copied-success-color': 'var(--chart-2)'
} as React.CSSProperties

function toPath(keys: (string | number)[]): string {
  return keys.reduce<string>(
    (acc, k, i) => (typeof k === 'number' ? `${acc}[${k}]` : i === 0 ? String(k) : `${acc}.${k}`),
    ''
  )
}

function CopyButton({
  label,
  copiedLabel,
  onCopy,
  icon,
  variant = 'ghost',
  disabled = false
}: {
  label: string
  copiedLabel: string
  onCopy: () => string | Promise<string>
  icon: React.ReactNode
  variant?: 'ghost' | 'outline'
  disabled?: boolean
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  return (
    <Button
      size="xs"
      variant={variant}
      disabled={copied || disabled}
      onClick={async () => {
        const text = await onCopy()
        if (!text) return
        await navigator.clipboard.writeText(text).catch(() => {})
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? <Check className="text-chart-2" /> : icon}
      {copied ? copiedLabel : label}
    </Button>
  )
}

export function JsonInputEditor({
  value,
  onValueChange,
  disabled = false,
  readOnly = false,
  label = '编辑器',
  placeholder = '粘贴或输入 JSON，如 {"hello": "world"}',
  ariaLabel = 'JSON 输入',
  className
}: {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  label?: string
  placeholder?: string
  ariaLabel?: string
  className?: string
}): React.JSX.Element {
  const parsed = useMemo(() => {
    const trimmed = value.trim()
    if (!trimmed) return { error: null as string | null }
    try {
      JSON.parse(trimmed) as unknown
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }, [value])

  const paste = useCallback(async (): Promise<void> => {
    const clipboardText = await navigator.clipboard.readText().catch(() => '')
    if (clipboardText) onValueChange(clipboardText)
  }, [onValueChange])

  const format = (): void => {
    if (!value.trim() || parsed.error) return
    onValueChange(JSON.stringify(JSON.parse(value) as unknown, null, 2))
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="flex items-center gap-1.5 border-b px-3 py-2">
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        {parsed.error ? (
          <Tooltip.Root>
            <Tooltip.Trigger
              className="max-w-64 truncate border-0 bg-transparent p-0 text-left text-xs text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="查看完整 JSON 解析错误"
              delay={0}
            >
              解析失败：{parsed.error}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={6}>
                <Tooltip.Popup className="z-50 max-w-sm break-words rounded-md border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
                  {parsed.error}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : value.trim() ? (
          <span className="text-xs text-muted-foreground">
            有效 JSON · {new Blob([value]).size} 字节
          </span>
        ) : null}
        <span className="mr-auto" />
        {!readOnly && (
          <>
            <Button size="xs" variant="ghost" onClick={() => void paste()} disabled={disabled}>
              <ClipboardPaste />
              粘贴
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={format}
              disabled={disabled || !value.trim() || !!parsed.error}
            >
              格式化
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onValueChange('')}
              disabled={disabled || !value.trim()}
            >
              <Eraser />
              清空
            </Button>
          </>
        )}
        <CopyButton
          label="复制"
          copiedLabel="已复制"
          icon={<Copy />}
          onCopy={() => value}
          disabled={disabled || !value.trim()}
        />
      </div>
      <textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        spellCheck={false}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  )
}

const LEVELS = [1, 2, 3] as const

export default function JsonPanel(): React.JSX.Element {
  const [text, setText] = useState('')
  const [expandMode, setExpandMode] = useState<ExpandMode>('all')

  const parsed = useMemo(() => {
    const trimmed = text.trim()
    if (!trimmed) return { value: undefined as unknown, error: null as string | null }
    try {
      return { value: JSON.parse(trimmed) as unknown, error: null }
    } catch (err) {
      return { value: undefined, error: err instanceof Error ? err.message : String(err) }
    }
  }, [text])

  const collapsed = expandMode === 'all' ? false : expandMode === 'none' ? true : expandMode
  const isObject = parsed.value !== null && typeof parsed.value === 'object'

  const format = useCallback(
    (indent: number): string => {
      if (parsed.value === undefined || parsed.error) return ''
      return JSON.stringify(parsed.value, null, indent)
    },
    [parsed]
  )

  const onPathCopy = useCallback((keys: (string | number)[]): string => toPath(keys), [])

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto p-2 lg:grid-cols-2">
        <section className="flex min-h-72 flex-col rounded-xl border bg-card">
          <JsonInputEditor value={text} onValueChange={setText} />
        </section>

        <section className="flex min-h-72 flex-col rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
            <span className="mr-auto text-xs font-medium text-muted-foreground">解析结果</span>
            <Button
              size="icon-xs"
              variant={expandMode === 'all' ? 'default' : 'ghost'}
              aria-label="全部展开"
              title="全部展开"
              onClick={() => setExpandMode('all')}
              disabled={!text.trim() || !!parsed.error}
            >
              <ChevronsUpDown />
            </Button>
            <Button
              size="icon-xs"
              variant={expandMode === 'none' ? 'default' : 'ghost'}
              aria-label="全部收起"
              title="全部收起"
              onClick={() => setExpandMode('none')}
              disabled={!text.trim() || !!parsed.error}
            >
              <ChevronsDownUp />
            </Button>
            {LEVELS.map((n) => (
              <Button
                key={n}
                size="xs"
                variant={expandMode === n ? 'default' : 'ghost'}
                onClick={() => setExpandMode(n)}
                disabled={!text.trim() || !!parsed.error}
              >
                {n} 层
              </Button>
            ))}
            <CopyButton
              label="复制"
              copiedLabel="已复制"
              icon={<Copy />}
              onCopy={() => format(2)}
              disabled={!text.trim() || !!parsed.error}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {parsed.error || !text.trim() ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {text.trim() ? 'JSON 无效，无法生成树' : '左侧输入 JSON 后在此查看'}
              </div>
            ) : isObject ? (
              <JsonView
                key={String(expandMode)}
                value={parsed.value as object}
                collapsed={collapsed}
                enableClipboard
                displayDataTypes={false}
                shortenTextAfterLength={0}
                className={cn('text-xs')}
                style={THEME}
              >
                <JsonView.KeyName
                  render={(props, { keyName, keys }) => (
                    <span
                      {...props}
                      title="双击复制路径"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        if (keys?.length) {
                          void navigator.clipboard.writeText(onPathCopy(keys)).catch(() => {})
                        } else if (keyName !== undefined) {
                          void navigator.clipboard.writeText(String(keyName)).catch(() => {})
                        }
                      }}
                    />
                  )}
                />
              </JsonView>
            ) : (
              <div className="font-mono text-xs">
                <span className="text-muted-foreground">root:</span>{' '}
                <span className="text-chart-4">{JSON.stringify(parsed.value)}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
