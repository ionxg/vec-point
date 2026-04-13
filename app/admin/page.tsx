import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

type QrRow = {
  id: string
  title: string
  token: string
  points: number
  active: boolean
  created_at: string
}

type QrWithImage = QrRow & {
  qrImage: string
  scanUrl: string
}

export default async function AdminPage() {
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const qrCodesWithImages: QrWithImage[] = await Promise.all(
    ((qrCodes || []) as QrRow[]).map(async (qr) => {
      const scanUrl = `${baseUrl}/scan/${qr.token}`
      const qrImage = await QRCode.toDataURL(scanUrl)

      return {
        ...qr,
        scanUrl,
        qrImage,
      }
    })
  )

  async function logout() {
    'use server'

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
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

        <div className="rounded border p-5">
          <h2 className="text-2xl font-semibold mb-4">QR Codes</h2>

          {qrCodesWithImages.length === 0 ? (
            <p>No QR codes yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {qrCodesWithImages.map((qr) => (
                <div key={qr.id} className="rounded border p-4">
                  <div className="mb-4 flex justify-center">
                    <Image
                      src={qr.qrImage}
                      alt={`QR code for ${qr.title}`}
                      width={220}
                      height={220}
                    />
                  </div>

                  <p className="mb-1">
                    <strong>Title:</strong> {qr.title}
                  </p>
                  <p className="mb-1">
                    <strong>Points:</strong> {qr.points}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong> {qr.active ? 'Active' : 'Inactive'}
                  </p>
                  <p className="mb-1 break-all">
                    <strong>Token:</strong> {qr.token}
                  </p>
                  <p className="mb-1 break-all">
                    <strong>Scan URL:</strong> {qr.scanUrl}
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