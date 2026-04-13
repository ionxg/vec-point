import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
    message?: string
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const error = params.error
  const message = params.message
  const next = params.next || '/me'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/me')
  }

  async function login(formData: FormData) {
    'use server'

    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const nextPath = String(formData.get('next') || '/me')

    if (!email || !password) {
      redirect('/login?error=Please+fill+in+email+and+password')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    redirect(nextPath)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        {error && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">
            {message}
          </p>
        )}

        <form action={login} className="space-y-4 rounded border p-5">
          <input type="hidden" name="next" value={next} />

          <div>
            <label className="mb-1 block font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Password</label>
            <input
              name="password"
              type="password"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  )
}