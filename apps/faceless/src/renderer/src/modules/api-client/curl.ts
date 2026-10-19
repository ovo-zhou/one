export interface CurlRequest {
  url: string
  method: string
  headers: Array<[string, string]>
  body: string
}

const DATA_OPTIONS = new Set([
  '-d',
  '--data',
  '--data-ascii',
  '--data-binary',
  '--data-raw',
  '--data-urlencode'
])

const VALUE_OPTIONS = new Set([
  '-A',
  '-b',
  '-e',
  '-H',
  '-o',
  '-u',
  '-X',
  '--cacert',
  '--cert',
  '--connect-timeout',
  '--cookie',
  '--data',
  '--data-ascii',
  '--data-binary',
  '--data-raw',
  '--data-urlencode',
  '--header',
  '--key',
  '--max-time',
  '--output',
  '--proxy',
  '--referer',
  '--request',
  '--url',
  '--user',
  '--user-agent'
])

function tokenizeCurl(command: string): string[] {
  const tokens: string[] = []
  let token = ''
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]

    if (escaped) {
      if (char !== '\n') token += char
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (quote) {
      if (char === quote) quote = null
      else token += char
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (token) {
        tokens.push(token)
        token = ''
      }
      continue
    }

    token += char
  }

  if (quote) throw new Error('cURL 命令中有未闭合的引号')
  if (escaped) token += '\\'
  if (token) tokens.push(token)
  return tokens
}

function readOption(
  tokens: string[],
  index: number
): { option: string; value: string | null; next: number } {
  const token = tokens[index]
  const equalIndex = token.indexOf('=')
  if (equalIndex > 0) {
    return { option: token.slice(0, equalIndex), value: token.slice(equalIndex + 1), next: index }
  }

  if (token.startsWith('-X') && token.length > 2)
    return { option: '-X', value: token.slice(2), next: index }
  if (token.startsWith('-H') && token.length > 2)
    return { option: '-H', value: token.slice(2), next: index }
  if (token.startsWith('-d') && token.length > 2)
    return { option: '-d', value: token.slice(2), next: index }

  if (!VALUE_OPTIONS.has(token)) return { option: token, value: null, next: index }
  if (!tokens[index + 1]) throw new Error(`选项 ${token} 缺少值`)
  return { option: token, value: tokens[index + 1], next: index + 1 }
}

function addHeader(headers: Array<[string, string]>, value: string): void {
  const separator = value.indexOf(':')
  if (separator < 1) throw new Error(`无效的 Header：${value}`)
  headers.push([value.slice(0, separator).trim(), value.slice(separator + 1).trim()])
}

/** Parses the common options emitted by browser DevTools “Copy as cURL”. */
export function parseCurl(command: string): CurlRequest {
  const tokens = tokenizeCurl(command)
  const curlIndex = tokens.findIndex(
    (token) => token === 'curl' || token === 'curl.exe' || token.endsWith('/curl')
  )
  if (curlIndex < 0) throw new Error('请输入以 curl 开头的命令')

  const headers: Array<[string, string]> = []
  const data: string[] = []
  let method: string | null = null
  let url: string | null = null
  let useGet = false

  for (let index = curlIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === '--') {
      url = tokens[index + 1] ?? null
      break
    }
    if (!token.startsWith('-')) {
      url = token
      continue
    }

    const { option, value, next } = readOption(tokens, index)
    index = next

    if (option === '-X' || option === '--request') {
      method = value
    } else if (option === '-H' || option === '--header') {
      if (value) addHeader(headers, value)
    } else if (DATA_OPTIONS.has(option)) {
      if (value?.startsWith('@')) throw new Error('暂不支持从文件读取 --data 内容')
      if (value !== null) data.push(value)
    } else if (option === '--url') {
      url = value
    } else if (option === '-I' || option === '--head') {
      method = 'HEAD'
    } else if (option === '-G' || option === '--get') {
      useGet = true
    } else if (option === '-F' || option === '--form') {
      throw new Error('暂不支持导入 multipart form-data 请求')
    } else if (option === '-A' || option === '--user-agent') {
      if (value) headers.push(['User-Agent', value])
    } else if (option === '-b' || option === '--cookie') {
      if (value) headers.push(['Cookie', value])
    } else if (option === '-e' || option === '--referer') {
      if (value) headers.push(['Referer', value])
    }
  }

  if (!url) throw new Error('cURL 命令中未找到 URL')

  const dataText = data.join('&')
  if (useGet && dataText) url += `${url.includes('?') ? '&' : '?'}${dataText}`

  return {
    url,
    method: (method ?? (dataText && !useGet ? 'POST' : 'GET')).toUpperCase(),
    headers,
    body: useGet ? '' : dataText
  }
}
