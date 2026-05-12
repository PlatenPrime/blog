import { createFileRoute } from '@tanstack/react-router'
import { SHARED_CONTRACTS_VERSION } from '@blog/shared-contracts'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Shared contracts: <code>{SHARED_CONTRACTS_VERSION}</code>
      </p>
    </div>
  )
}
