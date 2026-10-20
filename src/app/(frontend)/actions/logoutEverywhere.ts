'use server'

import { redirect } from 'next/navigation'

import { logoutEverywhereAction } from '@/auth/actions'

export async function logoutEverywhereFormAction(): Promise<void> {
  await logoutEverywhereAction()
  redirect('/')
}
