import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">VEC Points</h1>
        <p className="text-lg mb-8">
          Member points system for Victoria Engineering Club.
        </p>

        <div className="flex flex-wrap gap-3">
          {user ? (
            <>
              <Link
                href="/me"
                className="rounded bg-black px-4 py-2 text-white"
              >
                My Score
              </Link>
              <Link
                href="/admin"
                className="rounded border px-4 py-2"
              >
                Admin
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded bg-black px-4 py-2 text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded border px-4 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}