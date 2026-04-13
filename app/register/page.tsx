import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string
    message?: string
  }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const error = params.error
  const message = params.message

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/me')
  }

  async function register(formData: FormData) {
    'use server'

    const fullName = String(formData.get('full_name') || '').trim()
    const studentId = String(formData.get('student_id') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!fullName || !studentId || !email || !password) {
      redirect('/register?error=Please+fill+in+all+fields')
    }

    const supabase = await createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
        },
      },
    })

    if (signUpError) {
      redirect(`/register?error=${encodeURIComponent(signUpError.message)}`)
    }

    if (!data.user) {
      redirect('/register?error=Could+not+create+user')
    }

    const { error: insertError } = await supabase.from('members').insert({
      id: data.user.id,
      student_id: studentId,
      full_name: fullName,
      email,
    })

    if (insertError) {
      redirect(`/register?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/me')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold mb-6">Register</h1>

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

        <form action={register} className="space-y-4 rounded border p-5">
          <div>
            <label className="mb-1 block font-medium">Full Name</label>
            <input
              name="full_name"
              type="text"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Student ID</label>
            <input
              name="student_id"
              type="text"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

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
            Create Account
          </button>
        </form>
      </div>
    </main>
  )
}