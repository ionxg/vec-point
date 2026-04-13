import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AdminPageProps = {
  searchParams: Promise<{
    message?: string
  }>
}

type QrRow = {
  id: string
  title: string
  token: string
  points: number
  active: boolean
  created_at: string
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams
  const message = params.message

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, full_name, is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) {
    redirect('/me')
  }

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('id, title, token, points, active, created_at')
    .order('created_at', { ascending: false })

  async function logout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          <div className="flex gap-3">
            <Link href="/me" className="rounded border px-4 py-2">
              My Score
            </Link>
            <Link href="/admin/qr" className="rounded bg-black px-4 py-2 text-white">
              Create QR
            </Link>
            <form action={logout}>
              <button type="submit" className="rounded border px-4 py-2">
                Logout
              </button>
            </form>
          </div>
        </div>

        {message && (
          <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">
            {message}
          </p>
        )}

        <div className="rounded border p-5">
          <h2 className="text-2xl font-semibold mb-4">QR Codes</h2>

          {!qrCodes || qrCodes.length === 0 ? (
            <p>No QR codes yet.</p>
          ) : (
            <div className="space-y-3">
              {(qrCodes as QrRow[]).map((qr) => (
                <div key={qr.id} className="rounded border p-4">
                  <p className="mb-1">
                    <strong>Title:</strong> {qr.title}
                  </p>
                  <p className="mb-1">
                    <strong>Points:</strong> {qr.points}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong> {qr.active ? 'Active' : 'Inactive'}
                  </p>
                  <p className="mb-1">
                    <strong>Token:</strong> {qr.token}
                  </p>
                  <p className="mb-1">
                    <strong>Scan URL:</strong> /scan/{qr.token}
                  </p>
                  <p>
                    <strong>Created:</strong>{' '}
                    {new Date(qr.created_at).toLocaleString()}
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