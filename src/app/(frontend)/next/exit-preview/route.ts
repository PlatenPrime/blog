import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Leave Next.js draftMode (roadmap 035).
 */
export async function GET(): Promise<never> {
  const draft = await draftMode()
  draft.disable()
  redirect('/')
}
