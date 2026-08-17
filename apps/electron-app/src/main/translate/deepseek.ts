import { getPrefs } from '../prefs'
import { readDshApiKey } from './selection-watcher'

/**
 * DeepSeek chat-completions streaming client. The API key resolves from
 * prefs (translate.apiKey) first, falling back to the dsh CLI credentials
 * (~/.dsh/.credentials.yaml) so both features share one login.
 */

const API_URL = 'https://api.deepseek.com/chat/completions'

export function resolveApiKey(): string | null {
  const own = getPrefs().translate.apiKey
  if (own) return own
  return readDshApiKey()
}

function systemPrompt(targetEn: boolean): string {
  return targetEn
    ? '你是翻译引擎。将用户提供的文本翻译成英文，只输出译文，不要任何解释或额外内容，保留原文的格式与换行。'
    : '你是翻译引擎。将用户提供的文本翻译成中文，只输出译文，不要任何解释或额外内容，保留原文的格式与换行。'
}

export interface StreamCallbacks {
  onDelta(text: string): void
}

/**
 * Streams a translation and resolves with the full text. `signal` aborts the
 * request (tooltip dismissed). Throws with a user-facing message on failure.
 */
export async function streamTranslation(
  text: string,
  targetEn: boolean,
  signal: AbortSignal,
  cb: StreamCallbacks
): Promise<string> {
  const apiKey = resolveApiKey()
  if (!apiKey) {
    throw new Error(
      '未配置 DeepSeek API Key：请到 设置 → 翻译 填写，或先在 DeepSeek Harness 模块登录'
    )
  }

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getPrefs().translate.model,
        stream: true,
        max_tokens: 2048,
        // V4 defaults to thinking mode; disable it to keep translation snappy.
        thinking: { type: 'disabled' },
        messages: [
          { role: 'system', content: systemPrompt(targetEn) },
          { role: 'user', content: text }
        ]
      }),
      signal
    })
  } catch (err) {
    if (signal.aborted) throw new Error('aborted')
    throw new Error(`网络请求失败：${err instanceof Error ? err.message : String(err)}`)
  }

  if (!response.ok || !response.body) {
    let detail = `HTTP ${response.status}`
    try {
      const data = (await response.json()) as { error?: { message?: string } }
      if (data.error?.message) detail = data.error.message
    } catch {
      // keep HTTP status detail
    }
    if (response.status === 401) {
      throw new Error('API Key 无效，请到 设置 → 翻译 检查')
    }
    throw new Error(`翻译失败：${detail}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''

  const handleLine = (line: string): boolean => {
    if (!line.startsWith('data:')) return true
    const data = line.slice(5).trim()
    if (!data || data === '[DONE]') return data !== '[DONE]'
    try {
      const chunk = JSON.parse(data) as {
        choices?: { delta?: { content?: string | null } }[]
      }
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        full += delta
        cb.onDelta(full)
      }
    } catch {
      // ignore malformed keep-alive lines
    }
    return true
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '')
        buf = buf.slice(nl + 1)
        if (!handleLine(line)) return full
      }
    }
    const rest = buf.trim()
    if (rest) handleLine(rest)
  } catch (err) {
    if (signal.aborted) throw new Error('aborted')
    throw new Error(`流式读取失败：${err instanceof Error ? err.message : String(err)}`)
  }

  if (!full.trim()) throw new Error('模型未返回内容，请重试')
  return full
}
