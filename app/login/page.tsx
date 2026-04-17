import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
    message?: string
    next?: string
  }>
}

function makeStudentEmail(studentId: string) {
  return `${studentId}@vec.local`
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

    const studentId = String(formData.get('student_id') || '').trim()
    const nextPath = String(formData.get('next') || '/me')

    if (!studentId) {
      redirect('/login?error=Please+enter+your+student+ID')
    }

    const supabase = await createClient()

    const { data: member } = await supabase
      .from('members')
      .select('student_id, full_name, is_admin, can_access')
      .eq('student_id', studentId)
      .maybeSingle()

    if (!member) {
      redirect('/login?error=Student+ID+not+approved')
    }

    if (!member.can_access) {
      redirect('/login?error=Access+disabled')
    }

    const email = `${studentId}@vec.local`
    const password = studentId

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    let authUser = signInData.user

    if (signInError) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        })

      if (signUpError) {
        redirect(`/login?error=${encodeURIComponent(signUpError.message)}`)
      }

      authUser = signUpData.user
    }

    if (!authUser) {
      redirect('/login?error=Login+failed')
    }

    const { error: updateError } = await supabase
      .from('members')
      .update({
        auth_user_id: authUser.id,
        email,
      })
      .eq('student_id', studentId)

    if (updateError) {
      redirect(`/login?error=${encodeURIComponent(updateError.message)}`)
    }

    redirect(nextPath)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/vec-logo.png"
            alt="VEC Logo"
            width={210}
            height={210}
            className="mb-3"
          />
          <h1 className="text-3xl font-bold">Member Login</h1>
          <p className="text-sm text-gray-600">Victoria Engineering Club</p>
        </div>

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
            <label className="mb-1 block font-medium">Student ID</label>
            <input
              name="student_id"
              type="text"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <p className="text-sm text-gray-600">
            Your default password is your student ID.
          </p>

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