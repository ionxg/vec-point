import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type LogRow = {
  id: string
  points: number
  created_at: string
  qr_codes: {
    title: string
  }[] | null
}

export default async function MePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('student_id, full_name, email, is_admin, total_points')
    .eq('auth_user_id', user.id)
    .single()

  if (memberError || !member) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">My Score</h1>
          <p>Could not load your member profile.</p>
        </div>
      </main>
    )
  }

  const { data: logs, error: logsError } = await supabase
    .from('point_logs')
    .select('id, points, created_at, qr_codes(title)')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  if (logsError) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">My Score</h1>
          <p>Could not load your points history.</p>
        </div>
      </main>
    )
  }

  const safeLogs = (logs || []) as LogRow[]
  const totalPoints = member.points ?? 0

  async function logout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">My Score</h1>

          <div className="flex gap-3">
            {member.is_admin && (
              <Link href="/admin" className="rounded border px-4 py-2">
                Admin
              </Link>
            )}

            <form action={logout}>
              <button type="submit" className="rounded bg-black px-4 py-2 text-white">
                Logout
              </button>
            </form>
          </div>
        </div>

        <div className="mb-8 rounded border p-5">
          <p className="mb-2">
            <strong>Name:</strong> {member.full_name}
          </p>
          <p className="mb-2">
            <strong>Student ID:</strong> {member.student_id}
          </p>
          <p className="text-xl font-semibold">
            Total Points: {totalPoints}
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Scan History</h2>

          {safeLogs.length === 0 ? (
            <p className="rounded border p-4">No scans yet.</p>
          ) : (
            <div className="space-y-3">
              {safeLogs.map((log) => (
                <div key={log.id} className="rounded border p-4">
                  <p className="mb-1">
                    <strong>QR:</strong> {log.qr_codes?.[0]?.title || 'Unknown QR'}
                  </p>
                  <p className="mb-1">
                    <strong>Points:</strong> {log.points}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}