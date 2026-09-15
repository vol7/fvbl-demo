/** Owner-facing link shown in the SMS and the confirm page's address bar. */
export function smsLink(token: string): string {
  return `fvbl.on.ca/c/${token}`
}
