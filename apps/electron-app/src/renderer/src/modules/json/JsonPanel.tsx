import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JsonView from '@uiw/react-json-view'
import {
  Braces,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  ClipboardPaste,
  Copy,
  Eraser,
  Minimize2
} from 'lucide-react'
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
  variant = 'ghost'
}: {
  label: string
  copiedLabel: string
  onCopy: () => string | Promise<string>
  icon: React.ReactNode
  variant?: 'ghost' | 'outline'
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
      disabled={copied}
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

const LEVELS = [1, 2, 3] as const

export default function JsonPanel(): React.JSX.Element {
  const [text, setText] = useState('')
  const [expandMode, setExpandMode] = useState<ExpandMode>(2)

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

  const paste = useCallback(async (): Promise<void> => {
    const clip = await navigator.clipboard.readText().catch(() => '')
    if (clip) setText(clip)
  }, [])

  const format = useCallback(
    (indent: number): string => {
      if (parsed.value === undefined || parsed.error) return ''
      return JSON.stringify(parsed.value, null, indent)
    },
    [parsed]
  )

  const onPathCopy = useCallback((keys: (string | number)[]): string => toPath(keys), [])

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto p-6">
      <div className="flex items-center gap-3">
        <Braces className="size-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold tracking-tight">JSON 工具</h1>
        <span className="text-xs text-muted-foreground">
          输入即解析 · 双击 key 复制路径 · 悬停复制值
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-72 flex-col rounded-xl border bg-card">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="mr-auto text-xs font-medium text-muted-foreground">输入</span>
            <Button size="xs" variant="ghost" onClick={() => void paste()}>
              <ClipboardPaste />
              粘贴
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setText('')}>
              <Eraser />
              清空
            </Button>
            <CopyButton label="复制" copiedLabel="已复制" icon={<Copy />} onCopy={() => text} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder='粘贴或输入 JSON，如 {"hello": "world"}'
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground/60"
          />
          <div className="border-t px-3 py-1.5 text-xs">
            {parsed.error ? (
              <p className="truncate text-destructive" title={parsed.error}>
                解析失败：{parsed.error}
              </p>
            ) : text.trim() ? (
              <p className="text-muted-foreground">有效 JSON · {new Blob([text]).size} 字节</p>
            ) : (
              <p className="text-muted-foreground">等待输入…</p>
            )}
          </div>
        </section>

        <section className="flex min-h-72 flex-col rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
            <span className="mr-auto text-xs font-medium text-muted-foreground">解析结果</span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="全部展开"
              title="全部展开"
              onClick={() => setExpandMode('all')}
            >
              <ChevronsUpDown />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="全部收起"
              title="全部收起"
              onClick={() => setExpandMode('none')}
            >
              <ChevronsDownUp />
            </Button>
            {LEVELS.map((n) => (
              <Button
                key={n}
                size="xs"
                variant={expandMode === n ? 'default' : 'ghost'}
                onClick={() => setExpandMode(n)}
              >
                {n} 层
              </Button>
            ))}
            <CopyButton
              label="格式化"
              copiedLabel="已复制"
              icon={<Copy />}
              onCopy={() => format(2)}
            />
            <CopyButton
              label="压缩"
              copiedLabel="已复制"
              icon={<Minimize2 />}
              onCopy={() => format(0)}
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
