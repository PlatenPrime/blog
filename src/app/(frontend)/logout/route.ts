import config from '@payload-config'
import { logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'

export async function POST(): Promise<never> {
  await logout({ config })
  redirect('/')
}

export async function GET(): Promise<never> {
  await logout({ config })
  redirect('/')
}
