/**
 * Slack 通知などの副作用をここに集約する。
 *
 * 本番では Webhook URL を BFF 経由で叩くが、
 * 今回はコンソールログでエミュレートする。
 */

export function notifySlack(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[Slack #ff17-planner] ${message}`)
}
