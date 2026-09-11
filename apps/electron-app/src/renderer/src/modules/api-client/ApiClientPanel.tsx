import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Import,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2
} from 'lucide-react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Dialog } from '@base-ui/react/dialog'
import { Input } from '@base-ui/react/input'
import { Select } from '@base-ui/react/select'
import type { ApiClientSnapshot, ApiRequestResponse } from '../../../../shared/contracts'
import { Button } from '../../components/ui/button'
import { parseCurl } from './curl'
import './api-client.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const PROTOCOLS = ['https://', 'http://'] as const
const HTTP_HEADER_NAMES = `
A-IM
Accept
Accept-Additions
Accept-CH
Accept-Charset
Accept-Datetime
Accept-Encoding
Accept-Features
Accept-Language
Accept-Patch
Accept-Post
Accept-Query
Accept-Ranges
Accept-Signature
Access-Control
Access-Control-Allow-Credentials
Access-Control-Allow-Headers
Access-Control-Allow-Methods
Access-Control-Allow-Origin
Access-Control-Expose-Headers
Access-Control-Max-Age
Access-Control-Request-Headers
Access-Control-Request-Method
Activate-Storage-Access
Age
Allow
ALPN
Alt-Svc
Alt-Used
Alternates
AMP-Cache-Transform
Apply-To-Redirect-Ref
Authentication-Control
Authentication-Info
Authorization
Available-Dictionary
C-Ext
C-Man
C-Opt
C-PEP
C-PEP-Info
Cache-Control
Cache-Group-Invalidation
Cache-Groups
Cache-Status
Cal-Managed-ID
CalDAV-Timezones
Capsule-Protocol
CDN-Cache-Control
CDN-Loop
Cert-Not-After
Cert-Not-Before
Clear-Site-Data
Client-Cert
Client-Cert-Chain
Close
CMCD-Object
CMCD-Request
CMCD-Session
CMCD-Status
CMSD-Dynamic
CMSD-Static
Concealed-Auth-Export
Configuration-Context
Connect-UDP-Bind
Connection
Content-Base
Content-Digest
Content-Disposition
Content-Encoding
Content-ID
Content-Language
Content-Length
Content-Location
Content-MD5
Content-Range
Content-Script-Type
Content-Security-Policy
Content-Security-Policy-Report-Only
Content-Style-Type
Content-Type
Content-Version
Cookie
Cookie2
Cross-Origin-Embedder-Policy
Cross-Origin-Embedder-Policy-Report-Only
Cross-Origin-Opener-Policy
Cross-Origin-Opener-Policy-Report-Only
Cross-Origin-Resource-Policy
CTA-Common-Access-Token
DASL
Date
DAV
Default-Style
Delta-Base
Deprecation
Depth
Derived-From
Destination
Detached-JWS
Differential-ID
Dictionary-ID
Digest
DPoP
DPoP-Nonce
Early-Data
EDIINT-Features
ETag
Expect
Expect-CT
Expires
Ext
Forwarded
From
GetProfile
Hobareg
Host
HTTP2-Settings
If
If-Match
If-Modified-Since
If-None-Match
If-Range
If-Schedule-Tag-Match
If-Unmodified-Since
IM
Include-Referred-Token-Binding-ID
Incremental
Isolation
Keep-Alive
Label
Last-Event-ID
Last-Modified
Link
Link-Template
Location
Lock-Token
Man
Max-Forwards
Memento-Datetime
Meter
Method-Check
Method-Check-Expires
MIME-Version
Negotiate
NEL
OData-EntityId
OData-Isolation
OData-MaxVersion
OData-Version
Opt
Optional-WWW-Authenticate
Ordering-Type
Origin
Origin-Agent-Cluster
OSCORE
OSLC-Core-Version
Overwrite
P3P
PEP
PEP-Info
Permissions-Policy
PICS-Label
Ping-From
Ping-To
Position
Pragma
Prefer
Preference-Applied
Priority
ProfileObject
Protocol
Protocol-Info
Protocol-Query
Protocol-Request
Proxy-Authenticate
Proxy-Authentication-Info
Proxy-Authorization
Proxy-Features
Proxy-Instruction
Proxy-Public-Address
Proxy-Status
Public
Public-Key-Pins
Public-Key-Pins-Report-Only
Range
Redirect-Ref
Referer
Referer-Root
Referrer-Policy
Refresh
Repeatability-Client-ID
Repeatability-First-Sent
Repeatability-Request-ID
Repeatability-Result
Replay-Nonce
Reporting-Endpoints
Repr-Digest
Retry-After
Safe
Schedule-Reply
Schedule-Tag
Sec-Fetch-Dest
Sec-Fetch-Mode
Sec-Fetch-Site
Sec-Fetch-Storage-Access
Sec-Fetch-User
Sec-GPC
Sec-Purpose
Sec-Token-Binding
Sec-WebSocket-Accept
Sec-WebSocket-Extensions
Sec-WebSocket-Key
Sec-WebSocket-Protocol
Sec-WebSocket-Version
Security-Scheme
Server
Server-Timing
Set-Cookie
Set-Cookie2
Set-Txn
SetProfile
Signature
Signature-Input
SLUG
SoapAction
Status-URI
Strict-Transport-Security
Sunset
Surrogate-Capability
Surrogate-Control
TCN
TE
Timeout
Timing-Allow-Origin
Topic
Traceparent
Tracestate
Trailer
Transfer-Encoding
TTL
Unencoded-Digest
Upgrade
Urgency
URI
Use-As-Dictionary
User-Agent
Variant-Vary
Vary
Via
Want-Content-Digest
Want-Digest
Want-Repr-Digest
Want-Unencoded-Digest
Warning
WWW-Authenticate
X-Content-Type-Options
X-Frame-Options
X-Api-Key
X-CSRF-Token
X-Forwarded-For
X-Forwarded-Host
X-Forwarded-Proto
X-HTTP-Method-Override
X-Real-IP
X-Requested-With
X-XSS-Protection
*
`
  .trim()
  .split('\n')

type Header = { id: number; key: string; value: string }
type AutoHeader = { key: string; value: string }
type Protocol = (typeof PROTOCOLS)[number]

interface ResponseView extends ApiRequestResponse {
  bodyText: string
}

function decodeResponse(response: ApiRequestResponse): ResponseView {
  const text = new TextDecoder().decode(response.body)

  try {
    return { ...response, bodyText: JSON.stringify(JSON.parse(text) as unknown, null, 2) }
  } catch {
    return { ...response, bodyText: text }
  }
}

function HeaderNameInput({
  value,
  onValueChange
}: {
  value: string
  onValueChange: (value: string) => void
}): React.JSX.Element {
  return (
    <Autocomplete.Root items={HTTP_HEADER_NAMES} value={value} onValueChange={onValueChange}>
      <Autocomplete.InputGroup className="api-header-name-input-group">
        <Autocomplete.Input
          className="api-header-name-input"
          placeholder="Key"
          aria-label="Header 名称"
        />
        <Autocomplete.Trigger className="api-header-name-trigger" aria-label="选择 Header 名称">
          <ChevronDown />
        </Autocomplete.Trigger>
      </Autocomplete.InputGroup>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="api-header-name-positioner">
          <Autocomplete.Popup className="api-header-name-popup">
            <Autocomplete.Empty className="api-header-name-empty">无匹配字段</Autocomplete.Empty>
            <Autocomplete.List className="api-header-name-list">
              {(headerName: string) => (
                <Autocomplete.Item
                  className="api-header-name-item"
                  key={headerName}
                  value={headerName}
                >
                  {headerName}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}

export default function ApiClientPanel(): React.JSX.Element {
  const [method, setMethod] = useState<(typeof METHODS)[number]>('GET')
  const [protocol, setProtocol] = useState<Protocol>('https://')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<Header[]>([])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ResponseView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [autoHeadersExpanded, setAutoHeadersExpanded] = useState(false)
  const [curlDialogOpen, setCurlDialogOpen] = useState(false)
  const [curlCommand, setCurlCommand] = useState('')
  const [curlError, setCurlError] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<ApiClientSnapshot[]>([])
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    void window.api.getPrefs().then((prefs) => setSnapshots(prefs.apiClientSnapshots))
  }, [])

  const requestUrl = useMemo(() => `${protocol}${url.trim()}`, [protocol, url])
  const requestHeaders = useMemo(
    () =>
      headers
        .filter(({ key }) => key.trim())
        .map(({ key, value }) => [key.trim(), value] as [string, string]),
    [headers]
  )

  const autoHeaders = useMemo<AutoHeader[]>(() => {
    const manualHeaderNames = new Set(requestHeaders.map(([key]) => key.toLowerCase()))
    const hasBody = !['GET', 'HEAD'].includes(method) && Boolean(body)
    let host: string | null = null

    try {
      host = new URL(requestUrl).host
    } catch {
      // The send action remains disabled until the URL is valid.
    }

    const generated: Array<AutoHeader | null> = [
      host ? { key: 'Host', value: host } : null,
      { key: 'Connection', value: 'keep-alive' },
      { key: 'Accept', value: '*/*' },
      { key: 'Accept-Language', value: '*' },
      { key: 'Sec-Fetch-Mode', value: 'cors' },
      { key: 'User-Agent', value: 'node' },
      { key: 'Accept-Encoding', value: 'gzip, deflate' },
      hasBody
        ? { key: 'Content-Length', value: String(new TextEncoder().encode(body).byteLength) }
        : null
    ]

    return generated.filter(
      (header): header is AutoHeader =>
        header !== null && !manualHeaderNames.has(header.key.toLowerCase())
    )
  }, [body, method, requestHeaders, requestUrl])

  const canSend = useMemo(() => {
    try {
      const parsed = new URL(requestUrl)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, [requestUrl])

  const updateUrl = (value: string): void => {
    const match = /^(https?:\/\/)(.*)$/i.exec(value.trim())
    if (match) {
      setProtocol(match[1].toLowerCase() as Protocol)
      setUrl(match[2])
      return
    }
    setUrl(value)
  }

  const updateHeader = (id: number, field: 'key' | 'value', value: string): void => {
    setHeaders((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const importCurl = (): void => {
    try {
      const imported = parseCurl(curlCommand)
      if (!METHODS.includes(imported.method as (typeof METHODS)[number])) {
        throw new Error(`暂不支持 ${imported.method} 请求方法`)
      }

      const importedUrl = new URL(
        /^https?:\/\//i.test(imported.url) ? imported.url : `http://${imported.url}`
      )
      if (!['http:', 'https:'].includes(importedUrl.protocol)) {
        throw new Error('仅支持 HTTP 和 HTTPS 请求')
      }

      setMethod(imported.method as (typeof METHODS)[number])
      setProtocol(`${importedUrl.protocol}//` as Protocol)
      setUrl(`${importedUrl.host}${importedUrl.pathname}${importedUrl.search}`)
      setHeaders(
        imported.headers.map(([key, value], index) => ({ id: Date.now() + index, key, value }))
      )
      setBody(imported.body)
      setError(null)
      setResponse(null)
      setCurlError(null)
      setCurlCommand('')
      setCurlDialogOpen(false)
    } catch (reason) {
      setCurlError(reason instanceof Error ? reason.message : '无法解析 cURL 命令')
    }
  }

  const persistSnapshots = (next: ApiClientSnapshot[]): void => {
    setSnapshots(next)
    void window.api.setPrefs({ apiClientSnapshots: next }).catch(() => {})
  }

  const activeSnapshot = useMemo(
    () => snapshots.find((s) => s.id === activeSnapshotId) ?? null,
    [snapshots, activeSnapshotId]
  )

  const openSaveDialog = (): void => {
    setSaveTitle(activeSnapshot?.title ?? '')
    setSaveError(null)
    setSaveDialogOpen(true)
  }

  const confirmSave = (): void => {
    const title = saveTitle.trim()
    if (!title) return

    const now = Date.now()
    if (activeSnapshot) {
      persistSnapshots(
        snapshots.map((s) =>
          s.id === activeSnapshot.id
            ? {
                ...s,
                title,
                method,
                protocol,
                url: url.trim(),
                headers: requestHeaders,
                body,
                updatedAt: now
              }
            : s
        )
      )
    } else {
      const snapshot: ApiClientSnapshot = {
        id: crypto.randomUUID(),
        title,
        method,
        protocol,
        url: url.trim(),
        headers: requestHeaders,
        body,
        createdAt: now,
        updatedAt: now
      }
      persistSnapshots([snapshot, ...snapshots])
      setActiveSnapshotId(snapshot.id)
    }
    setSaveDialogOpen(false)
    setSaveTitle('')
    setSaveError(null)
  }

  const loadSnapshot = (snapshot: ApiClientSnapshot): void => {
    setMethod(
      METHODS.includes(snapshot.method as (typeof METHODS)[number])
        ? (snapshot.method as (typeof METHODS)[number])
        : 'GET'
    )
    setProtocol(snapshot.protocol === 'http://' ? 'http://' : 'https://')
    setUrl(snapshot.url)
    setHeaders(
      snapshot.headers.map(([key, value], index) => ({ id: Date.now() + index, key, value }))
    )
    setBody(snapshot.body)
    setResponse(null)
    setError(null)
    setAutoHeadersExpanded(false)
    setActiveSnapshotId(snapshot.id)
  }

  const deleteSnapshot = (id: string): void => {
    persistSnapshots(snapshots.filter((s) => s.id !== id))
    if (activeSnapshotId === id) setActiveSnapshotId(null)
  }

  const resetRequest = (): void => {
    setMethod('GET')
    setProtocol('https://')
    setUrl('')
    setHeaders([])
    setBody('')
    setResponse(null)
    setError(null)
    setAutoHeadersExpanded(false)
    setCurlDialogOpen(false)
    setCurlCommand('')
    setCurlError(null)
    setActiveSnapshotId(null)
  }

  const send = async (): Promise<void> => {
    if (!canSend) return

    setSending(true)
    setError(null)
    setResponse(null)

    try {
      const encodedBody = new TextEncoder().encode(body)
      const result = await window.api.sendApiRequest({
        url: requestUrl,
        method,
        headers: requestHeaders,
        body: ['GET', 'HEAD'].includes(method) || !body ? null : (encodedBody.buffer as ArrayBuffer)
      })
      setResponse(decodeResponse(result))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '请求失败，请检查网络和请求参数。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="api-client-panel">
      {snapshots.length > 0 && (
        <aside className="api-sidebar">
          <div className="api-sidebar-header">
            <Button
              size="sm"
              variant="outline"
              className="api-new-request-button"
              onClick={resetRequest}
            >
              <Plus /> 新增请求
            </Button>
          </div>
          <div className="api-sidebar-list">
            {snapshots.map((snapshot) => (
              <div
                className={
                  snapshot.id === activeSnapshotId
                    ? 'api-sidebar-item api-sidebar-item-active'
                    : 'api-sidebar-item'
                }
                key={snapshot.id}
                role="button"
                tabIndex={0}
                aria-label={`加载请求：${snapshot.title}`}
                onClick={() => loadSnapshot(snapshot)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    loadSnapshot(snapshot)
                  }
                }}
              >
                <span className="api-sidebar-item-method">{snapshot.method}</span>
                <div className="api-sidebar-item-body">
                  <span className="api-sidebar-item-title" title={snapshot.title}>
                    {snapshot.title}
                  </span>
                  <span
                    className="api-sidebar-item-url"
                    title={`${snapshot.protocol}${snapshot.url}`}
                  >
                    {snapshot.url ? `${snapshot.protocol}${snapshot.url}` : '未设置 URL'}
                  </span>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="api-sidebar-item-delete"
                  aria-label={`删除请求：${snapshot.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    deleteSnapshot(snapshot.id)
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div className="api-workspace">
        <section className="api-request-card">
          <div className="api-request-bar">
            <Select.Root value={method} onValueChange={(value) => value && setMethod(value)}>
              <Select.Trigger className="api-method-trigger" aria-label="请求方法">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  align="start"
                  alignItemWithTrigger={false}
                  className="api-method-positioner"
                  collisionAvoidance={{ side: 'none', align: 'shift', fallbackAxisSide: 'none' }}
                  side="bottom"
                  sideOffset={4}
                >
                  <Select.Popup className="api-method-popup">
                    <Select.List>
                      {METHODS.map((value) => (
                        <Select.Item className="api-method-item" key={value} value={value}>
                          <Select.ItemText>{value}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <div className="api-url-field">
              <Select.Root value={protocol} onValueChange={(value) => value && setProtocol(value)}>
                <Select.Trigger className="api-protocol-trigger" aria-label="请求协议">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner
                    align="start"
                    alignItemWithTrigger={false}
                    className="api-method-positioner"
                    collisionAvoidance={{ side: 'none', align: 'shift', fallbackAxisSide: 'none' }}
                    side="bottom"
                    sideOffset={4}
                  >
                    <Select.Popup className="api-method-popup">
                      <Select.List>
                        {PROTOCOLS.map((value) => (
                          <Select.Item className="api-method-item" key={value} value={value}>
                            <Select.ItemText>{value}</Select.ItemText>
                            <Select.ItemIndicator>
                              <Check />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.List>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
              <Input
                value={url}
                onValueChange={updateUrl}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void send()
                }}
                placeholder="api.example.com/v1/users"
                aria-label="请求地址"
              />
            </div>
            <Button onClick={() => void send()} disabled={!canSend || sending}>
              <Send />
              {sending ? '发送中…' : '发送'}
            </Button>
            <Button
              aria-label="导入 cURL 请求"
              size="icon"
              variant="outline"
              onClick={() => {
                setCurlError(null)
                setCurlDialogOpen(true)
              }}
            >
              <Import />
            </Button>
            <Button
              aria-label="重置当前请求"
              disabled={sending}
              size="icon"
              variant="outline"
              onClick={resetRequest}
            >
              <RotateCcw />
            </Button>
            <Button
              aria-label="保存当前请求"
              disabled={sending}
              size="icon"
              variant="outline"
              onClick={openSaveDialog}
            >
              <Save />
            </Button>
          </div>

          <div className="api-editor-grid">
            <section>
              <div className="api-section-title">
                <span>Headers</span>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    setHeaders((items) => [...items, { id: Date.now(), key: '', value: '' }])
                  }
                >
                  <Plus /> 添加
                </Button>
              </div>
              <div className="api-headers">
                {headers.length === 0 ? (
                  <p className="api-empty">未设置请求头</p>
                ) : (
                  headers.map((header) => (
                    <div className="api-header-row" key={header.id}>
                      <HeaderNameInput
                        value={header.key}
                        onValueChange={(value) => updateHeader(header.id, 'key', value)}
                      />
                      <Input
                        value={header.value}
                        onValueChange={(value) => updateHeader(header.id, 'value', value)}
                        placeholder="Value"
                        aria-label="Header 值"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        aria-label="删除 Header"
                        onClick={() =>
                          setHeaders((items) => items.filter((item) => item.id !== header.id))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))
                )}
                <div className="api-auto-headers">
                  <Button
                    className="api-auto-headers-toggle"
                    size="sm"
                    variant="ghost"
                    onClick={() => setAutoHeadersExpanded((expanded) => !expanded)}
                  >
                    {autoHeadersExpanded ? <ChevronDown /> : <ChevronRight />}
                    自动添加 ({autoHeaders.length})<span>由请求运行时生成</span>
                  </Button>
                  {autoHeadersExpanded && (
                    <div className="api-auto-headers-list">
                      {autoHeaders.map((header) => (
                        <div className="api-auto-header-row" key={header.key}>
                          <Input
                            aria-label={`自动 Header 名称：${header.key}`}
                            readOnly
                            value={header.key}
                          />
                          <Input
                            aria-label={`自动 Header 值：${header.key}`}
                            readOnly
                            value={header.value}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="api-section-title">
                <span>JSON Body</span>
                {['GET', 'HEAD'].includes(method) && (
                  <span className="api-hint">该方法不会发送 Body</span>
                )}
              </div>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={'{\n  "name": "Ada"\n}'}
                spellCheck={false}
                aria-label="JSON Body"
                disabled={['GET', 'HEAD'].includes(method)}
              />
            </section>
          </div>
        </section>

        <section className="api-response-card">
          <div className="api-response-title">
            <span>响应</span>
            {response && (
              <span
                className={response.status >= 400 ? 'api-status api-status-error' : 'api-status'}
              >
                {response.status} {response.statusText}
              </span>
            )}
          </div>
          {error ? (
            <p className="api-error">{error}</p>
          ) : response ? (
            <pre>{response.bodyText || '(空响应)'}</pre>
          ) : (
            <p className="api-empty">发送请求后在这里查看状态和响应内容</p>
          )}
        </section>
      </div>

      <Dialog.Root
        open={curlDialogOpen}
        onOpenChange={(open) => {
          setCurlDialogOpen(open)
          if (!open) setCurlError(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="api-curl-backdrop" />
          <Dialog.Popup className="api-curl-dialog">
            <Dialog.Title className="api-curl-title">导入 cURL 请求</Dialog.Title>
            <Dialog.Description className="api-curl-description">
              粘贴浏览器开发者工具或终端复制的 cURL 命令，将自动填充请求方法、URL、Headers 和 Body。
            </Dialog.Description>
            <textarea
              value={curlCommand}
              onChange={(event) => setCurlCommand(event.target.value)}
              placeholder={
                'curl -X POST "https://api.example.com/v1/users" \\\n+  -H "Authorization: Bearer token" \\\n+  -H "Content-Type: application/json" \\\n+  --data \'{"name":"Ada"}\''
              }
              spellCheck={false}
              aria-label="cURL 命令"
            />
            {curlError && <p className="api-curl-error">{curlError}</p>}
            <div className="api-curl-actions">
              <Dialog.Close render={<Button variant="outline">取消</Button>} />
              <Button onClick={importCurl} disabled={!curlCommand.trim()}>
                <Import /> 导入请求
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open)
          if (!open) setSaveError(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="api-curl-backdrop" />
          <Dialog.Popup className="api-curl-dialog">
            <Dialog.Title className="api-curl-title">
              {activeSnapshot ? '更新已保存请求' : '保存当前请求'}
            </Dialog.Title>
            <Dialog.Description className="api-curl-description">
              填写标题用于左侧列表识别，将保存当前请求配置（方法、URL、Headers、Body）的快照。
            </Dialog.Description>
            <Input
              value={saveTitle}
              onValueChange={setSaveTitle}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && saveTitle.trim()) confirmSave()
              }}
              placeholder="例如：登录接口"
              aria-label="请求标题"
            />
            {saveError && <p className="api-curl-error">{saveError}</p>}
            <div className="api-curl-actions">
              <Dialog.Close render={<Button variant="outline">取消</Button>} />
              <Button onClick={confirmSave} disabled={!saveTitle.trim()}>
                <Save /> {activeSnapshot ? '更新快照' : '保存快照'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
