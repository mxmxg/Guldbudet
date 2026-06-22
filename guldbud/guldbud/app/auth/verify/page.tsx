import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-10">
          <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
            ✉️
          </div>
          <h1 className="text-xl font-medium text-stone-900 mb-3">Bekräfta din e-post</h1>
          <p className="text-stone-500 text-sm mb-6">
            Vi har skickat ett bekräftelsemejl till din e-postadress. 
            Klicka på länken i mejlet för att aktivera ditt konto.
          </p>
          <p className="text-stone-400 text-xs mb-6">
            Hittar du inte mejlet? Kolla skräpposten.
          </p>
          <Link href="/" className="text-gold-600 hover:text-gold-700 text-sm font-medium transition">
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  )
}
