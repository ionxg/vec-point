import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('full_name, student_id, email')
    .eq('id', user.id)
    .single()

  const { data: scoreRow } = await supabase
    .from('member_scores')
    .select('total_points')
    .eq('id', user.id)
    .single()

  const { data: logs } = await supabase
    .from('point_logs')
    .select('id, points, created_at, qr_codes(title)')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  if (memberError || !member) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">My Score</h1>
        <p className="mt-4">Could not load your member profile.</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Score</h1>

      <div className="border rounded p-4 mb-6">
        <p><strong>Name:</strong> {member.full_name}</p>
        <p><strong>Student ID:</strong> {member.student_id}</p>
        <p><strong>Email:</strong> {member.email}</p>
        <p><strong>Total Points:</strong> {scoreRow?.total_points ?? 0}</p>
      </div>

      <h2 className="text-xl font-semibold mb-3">Scan History</h2>

      {!logs || logs.length === 0 ? (
        <p>No scans yet.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <div key={log.id} className="border rounded p-3">
              <p><strong>Points:</strong> {log.points}</p>
              <p><strong>Date:</strong> {new Date(log.created_at).toLocaleString()}</p>
              <p><strong>QR:</strong> {log.qr_codes?.title ?? 'Unknown QR'}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}