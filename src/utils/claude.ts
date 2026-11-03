// 用使用者自己的 API key，從瀏覽器直接請 Claude 寫景點介紹（網站沒有後端，key 不經過其他伺服器）

import type Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-5-5'

/** 失敗時丟出這個，message 直接顯示給使用者 */
export class IntroError extends Error {}

export async function writeIntro(apiKey: string, prompt: string): Promise<string> {
  // 按下去才載入 SDK，平常打開網站不用多下載
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new IntroError('API key 不正確，請重新設定。')
    if (e instanceof Anthropic.PermissionDeniedError) throw new IntroError('這個 API key 沒有使用權限，請到 Anthropic Console 確認。')
    if (e instanceof Anthropic.RateLimitError) throw new IntroError('太頻繁了，請等一下再試。')
    if (e instanceof Anthropic.APIConnectionError) throw new IntroError('連不上 Anthropic，請確認網路。')
    if (e instanceof Anthropic.APIError) throw new IntroError(`產生失敗（${e.status ?? '未知錯誤'}），請稍後再試。`)
    throw e
  }
  if (response.stop_reason === 'refusal') throw new IntroError('AI 沒有產生這個景點的介紹，請自己寫或換個說法。')
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
  if (!text) throw new IntroError('AI 沒有回覆內容，請再試一次。')
  return text
}
