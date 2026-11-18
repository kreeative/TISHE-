import { api } from './api'

// 'joined' once this visitor has given their email, from the popup or the footer
const JOINED_KEY = 'tis-welcome-popup'

export function hasJoined(): boolean {
  try {
    return localStorage.getItem(JOINED_KEY) === 'joined'
  } catch {
    return false
  }
}

function markJoined(): void {
  try {
    localStorage.setItem(JOINED_KEY, 'joined')
  } catch {
    // private mode: the popup may show again on the next visit
  }
}

// Adds the email to the Circle mailing list and sends the welcome email.
// Never throws: the signup must look successful to the visitor regardless.
export async function subscribeEmail(email: string, source: string): Promise<void> {
  markJoined()
  try {
    await api('subscribe', { email, source })
  } catch {
    // the offer is already on screen; a failed list signup shouldn't show as an error
  }
}
