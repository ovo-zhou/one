import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Import, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { Dialog } from '@base-ui/react/dialog'
import { Input } from '@base-ui/react/input'
import { Select } from '@base-ui/react/select'
import type { ApiClientSnapshot, ApiRequestResponse } from '../../../../shared/contracts'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { JsonInputEditor } from '../json/JsonPanel'
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

const BROWSER_REQUEST_HEADER_NAME_SET = new Set([
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Content-Encoding',
  'Content-Length',
  'Content-Type',
  'Cookie',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Origin',
  'Pragma',
  'Priority',
  'Range',
  'Referer',
  'Sec-Fetch-Dest',
  'Sec-Fetch-Mode',
  'Sec-Fetch-Site',
  'Sec-Fetch-User',
  'TE',
  'Transfer-Encoding',
  'Upgrade',
  'User-Agent',
  'X-Api-Key',
  'X-CSRF-Token',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Forwarded-Proto',
  'X-HTTP-Method-Override',
  'X-Real-IP',
  'X-Requested-With'
])

const BROWSER_REQUEST_HEADER_NAMES = [
  ...new Set([
    ...HTTP_HEADER_NAMES.filter((headerName) => BROWSER_REQUEST_HEADER_NAME_SET.has(headerName)),
    'DNT',
    'Sec-CH-UA',
    'Sec-CH-UA-Mobile',
    'Sec-CH-UA-Platform',
    'Upgrade-Insecure-Requests'
  ])
].sort()

const HEADER_VALUE_SUGGESTIONS: Record<string, string[]> = {
  accept: ['*/*', 'application/json', 'application/json, text/plain, */*', 'text/html'],
  'accept-encoding': ['gzip, deflate, br, zstd', 'gzip, deflate', 'identity'],
  'accept-language': ['zh-CN,zh;q=0.9,en;q=0.8', 'en-US,en;q=0.9', '*'],
  'access-control-request-headers': ['authorization, content-type', 'content-type'],
  'access-control-request-method': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  authorization: ['Bearer ', 'Basic '],
  'cache-control': ['no-cache', 'no-store', 'max-age=0'],
  connection: ['keep-alive', 'close'],
  'content-type': [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  dnt: ['1', '0'],
  origin: ['https://'],
  pragma: ['no-cache'],
  range: ['bytes=0-'],
  referer: ['https://'],
  'sec-fetch-dest': ['empty', 'document', 'image', 'script', 'style'],
  'sec-fetch-mode': ['cors', 'navigate', 'no-cors', 'same-origin', 'websocket'],
  'sec-fetch-site': ['cross-site', 'same-origin', 'same-site', 'none'],
  'sec-fetch-user': ['?1'],
  te: ['trailers'],
  upgrade: ['websocket'],
  'upgrade-insecure-requests': ['1'],
  'user-agent': ['node'],
  'x-requested-with': ['XMLHttpRequest']
}

const INITIAL_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ['Connection', 'keep-alive'],
  ['Accept', '*/*'],
  ['Accept-Language', '*'],
  ['Sec-Fetch-Mode', 'cors'],
  ['User-Agent', 'node'],
  ['Accept-Encoding', 'gzip, deflate']
]

type Header = { id: string; key: string; value: string }
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

let nextHeaderId = 0

function createHeader(key = '', value = ''): Header {
  nextHeaderId += 1
  return { id: `${Date.now()}-${nextHeaderId}`, key, value }
}

function headersFromPairs(headers: ReadonlyArray<readonly [string, string]>): Header[] {
  return headers.map(([key, value]) => createHeader(key, value))
}

function HeaderAutocompleteInput({
  value,
  onValueChange,
  items,
  placeholder,
  ariaLabel
}: {
  value: string
  onValueChange: (value: string) => void
  items: readonly string[]
  placeholder: string
  ariaLabel: string
}): React.JSX.Element {
  return (
    <Autocomplete.Root items={items} value={value} onValueChange={onValueChange}>
      <Autocomplete.InputGroup className="api-header-name-input-group">
        <Autocomplete.Input
          className="api-header-name-input"
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        <Autocomplete.Trigger className="api-header-name-trigger" aria-label={`选择${ariaLabel}`}>
          <ChevronDown />
        </Autocomplete.Trigger>
      </Autocomplete.InputGroup>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="api-header-name-positioner">
          <Autocomplete.Popup className="api-header-name-popup">
            <Autocomplete.Empty className="api-header-name-empty">无匹配选项</Autocomplete.Empty>
            <Autocomplete.List className="api-header-name-list">
              {(item: string) => (
                <Autocomplete.Item className="api-header-name-item" key={item} value={item}>
                  {item}
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
  const [headers, setHeaders] = useState<Header[]>(() => headersFromPairs(INITIAL_HEADERS))
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ResponseView | null>(null)
  const [showJsonResponse, setShowJsonResponse] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
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

  const updateHeader = (id: string, field: 'key' | 'value', value: string): void => {
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
      setHeaders(headersFromPairs(imported.headers))
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
    setHeaders(headersFromPairs(snapshot.headers))
    setBody(snapshot.body)
    setResponse(null)
    setError(null)
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
    setHeaders(headersFromPairs(INITIAL_HEADERS))
    setBody('')
    setResponse(null)
    setError(null)
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
    setShowJsonResponse(true)

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
                  onClick={() => setHeaders((items) => [...items, createHeader()])}
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
                      <HeaderAutocompleteInput
                        value={header.key}
                        onValueChange={(value) => updateHeader(header.id, 'key', value)}
                        items={BROWSER_REQUEST_HEADER_NAMES}
                        placeholder="Key"
                        ariaLabel="Header 名称"
                      />
                      <HeaderAutocompleteInput
                        value={header.value}
                        onValueChange={(value) => updateHeader(header.id, 'value', value)}
                        items={HEADER_VALUE_SUGGESTIONS[header.key.trim().toLowerCase()] ?? []}
                        placeholder="Value"
                        ariaLabel="Header 值"
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
              </div>
            </section>

            <section>
              <JsonInputEditor
                value={body}
                onValueChange={setBody}
                label=""
                placeholder={'{\n  "name": "Ada"\n}'}
                ariaLabel="JSON Body"
                disabled={['GET', 'HEAD'].includes(method)}
                className="api-json-body-editor"
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
            {response && (
              <label className="api-response-view-toggle">
                <span>JSON 预览</span>
                <Switch
                  checked={showJsonResponse}
                  onCheckedChange={setShowJsonResponse}
                  aria-label="切换 JSON 响应预览"
                />
              </label>
            )}
          </div>
          <div className="api-response-content">
            {error ? (
              <p className="api-error">{error}</p>
            ) : response ? (
              showJsonResponse ? (
                <JsonInputEditor
                  value={response.bodyText}
                  onValueChange={() => {}}
                  label=""
                  readOnly
                  ariaLabel="JSON 响应"
                  className="api-json-response-editor"
                />
              ) : (
                <pre>{response.bodyText || '(空响应)'}</pre>
              )
            ) : (
              <p className="api-empty">发送请求后在这里查看状态和响应内容</p>
            )}
          </div>
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
