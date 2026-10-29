import { api } from './api'

// Adds the email to the Circle mailing list and sends the welcome code.
// Never throws: the signup must look successful to the visitor regardless.
export async function subscribeEmail(email: string, source: string): Promise<void> {
  try {
    await api('subscribe', { email, source })
  } catch {
    // the code is already on screen; a failed list signup shouldn't show as an error
  }
}
