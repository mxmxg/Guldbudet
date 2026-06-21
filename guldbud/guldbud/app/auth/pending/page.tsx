import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">⏳</div>
        <h1 className="text-xl font-medium text-stone-900 mb-3">Tack för din registrering!</h1>
        <p className="text-stone-500 mb-6">
          Ditt handlarkonto granskas av vårt team. Du får ett e-postmeddelande inom 1–2 arbetsdagar när du är godkänd att börja buda.
        </p>
        <Link href="/" className="btn-outline inline-block">Tillbaka till startsidan</Link>
      </div>
    </div>
  )
}
