import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type AdminQrPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function AdminQrPage({ searchParams }: AdminQrPageProps) {
  const params = await searchParams
  const error = params.error

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, is_admin')
    .eq('id', user.id)
    .single()

  if (!member?.is_admin) {
    redirect('/me')
  }

  async function createQr(formData: FormData) {
    'use server'

    const title = String(formData.get('title') || '').trim()
    const pointsValue = String(formData.get('points') || '').trim()
    const active = formData.get('active') === 'on'

    const points = Number(pointsValue)

    if (!title || !pointsValue || Number.isNaN(points) || points <= 0) {
      redirect('/admin/qr?error=Please+enter+a+valid+title+and+points')
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: member } = await supabase
      .from('members')
      .select('id, is_admin')
      .eq('id', user.id)
      .single()

    if (!member?.is_admin) {
      redirect('/me')
    }

    const token = crypto.randomUUID()

    const { error } = await supabase.from('qr_codes').insert({
      title,
      token,
      points,
      active,
      created_by: user.id,
    })

    if (error) {
      redirect(`/admin/qr?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/admin?message=QR+code+created+successfully')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create QR Code</h1>
          <Link href="/admin" className="rounded border px-4 py-2">
            Back
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <form action={createQr} className="space-y-4 rounded border p-5">
          <div>
            <label className="mb-1 block font-medium">Title</label>
            <input
              name="title"
              type="text"
              className="w-full rounded border px-3 py-2"
              placeholder="Welcome Night 2026"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Points</label>
            <input
              name="points"
              type="number"
              min="1"
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <label className="flex items-center gap-2">
            <input name="active" type="checkbox" defaultChecked />
            <span>Active</span>
          </label>

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white"
          >
            Create QR
          </button>
        </form>
      </div>
    </main>
  )
}