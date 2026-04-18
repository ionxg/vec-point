import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ScanPageProps = {
  params: Promise<{
    token: string
  }>
  searchParams: Promise<{
    error?: string
  }>
}

export default async function ScanPage({ params, searchParams }: ScanPageProps) {
  const { token } = await params
  const qs = await searchParams
  const error = qs.error

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/scan/${token}`)}`)
  }

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('id, title, points, active, token')
    .eq('token', token)
    .single()

  async function claimPoints(formData: FormData) {
    'use server'

    const tokenValue = String(formData.get('token') || '')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/scan/${tokenValue}`)}`)
    }

    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, title, points, active, token')
      .eq('token', tokenValue)
      .single()

    if (qrError || !qrCode) {
      redirect(`/scan/${tokenValue}?error=Invalid+QR+code`)
    }

    if (!qrCode.active) {
      redirect(`/scan/${tokenValue}?error=This+QR+code+is+inactive`)
    }

    const { data: existingLog } = await supabase
      .from('point_logs')
      .select('id')
      .eq('member_id', user.id)
      .eq('qr_code_id', qrCode.id)
      .maybeSingle()

    if (existingLog) {
      redirect(`/scan/${tokenValue}?error=You+already+claimed+this+QR`)
    }

    const { error: insertError } = await supabase.from('point_logs').insert({
      member_id: user.id,
      qr_code_id: qrCode.id,
      points: qrCode.points,
    })

    if (insertError) {
      redirect(`/scan/${tokenValue}?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/me')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Scan QR</h1>

        {error && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {!qrCode ? (
          <div className="rounded border p-5">
            <p className="mb-4">QR code not found.</p>
            <Link href="/me" className="rounded bg-black px-4 py-2 text-white">
              Back to My Score
            </Link>
          </div>
        ) : (
          <div className="rounded border p-5">
            <p className="mb-2">
              <strong>Event:</strong> {qrCode.title}
            </p>
            <p className="mb-4">
              <strong>Points:</strong> {qrCode.points}
            </p>

            {!qrCode.active ? (
              <p className="mb-4 text-red-600">This QR code is inactive.</p>
            ) : (
              <form action={claimPoints} className="mb-4">
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="rounded bg-black px-4 py-2 text-white">
                  Claim Points
                </button>
              </form>
            )}

            <Link href="/me" className="inline-block rounded border px-4 py-2">
              Return to My Score
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}