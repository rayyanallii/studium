import { readFile } from 'node:fs/promises'

const vars = await readFile('.dev.vars', 'utf8').catch(() => '')
const key = process.env.EXPLABS_API_KEY || vars.match(/^EXPLABS_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1]
if (!key) throw new Error('Set EXPLABS_API_KEY before running this check.')
const response = await fetch('https://api.experientiallabs.ai/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gpt-6-luna', messages: [{ role: 'user', content: 'Reply with exactly: Studium gateway connected.' }], max_completion_tokens: 80 }),
  signal: AbortSignal.timeout(30000),
})
if (!response.ok) throw new Error(`Gateway returned HTTP ${response.status}`)
const result = await response.json()
console.log(JSON.stringify({ model: result.model, reply: result.choices?.[0]?.message?.content, usage: result.usage }, null, 2))
