import Image from 'next/image'
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
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/vec-logo.png"
            alt="VEC Logo"
            width={310}
            height={310}
            className="mb-3"
          />
          <h1 className="text-4xl font-bold mb-2">VEC Points</h1>
          <p className="text-lg text-center">
            Member points system for Victoria Engineering Club.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <>
              <Link href="/me" className="rounded bg-black px-4 py-2 text-white">
                My Score
              </Link>
              <Link href="/admin" className="rounded border px-4 py-2">
                Admin
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
              Login
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}