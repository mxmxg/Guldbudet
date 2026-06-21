'use client'
import { approveDealer, rejectDealer, approveItem, rejectItem } from '@/app/admin/actions'
import Image from 'next/image'

export default function AdminPanel({ pendingDealers, pendingItems }: {
  pendingDealers: any[]
  pendingItems: any[]
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-medium text-stone-900 mb-8">⚙️ Adminpanel</h1>

        {/* Handlare */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-stone-800 mb-4">
            Handlare som väntar på godkännande
            <span className="ml-2 bg-gold-100 text-gold-700 text-sm px-2 py-0.5 rounded-full">
              {pendingDealers.length}
            </span>
          </h2>
          {pendingDealers.length === 0 ? (
            <p className="text-stone-400 text-sm">Inga väntande handlare.</p>
          ) : (
            <div className="space-y-3">
              {pendingDealers.map(dealer => (
                <div key={dealer.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-900">{dealer.full_name}</p>
                    <p className="text-sm text-stone-500">{dealer.email}</p>
                    {dealer.company_name && (
                      <p className="text-sm text-stone-400">{dealer.company_name}</p>
                    )}
                    <p className="text-xs text-stone-300 mt-1">
                      {new Date(dealer.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={approveDealer.bind(null, dealer.id)}>
                      <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                        Godkänn
                      </button>
                    </form>
                    <form action={rejectDealer.bind(null, dealer.id)}>
                      <button className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                        Neka
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Föremål */}
        <section>
          <h2 className="text-lg font-medium text-stone-800 mb-4">
            Föremål som väntar på granskning
            <span className="ml-2 bg-gold-100 text-gold-700 text-sm px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          </h2>
          {pendingItems.length === 0 ? (
            <p className="text-stone-400 text-sm">Inga väntande föremål.</p>
          ) : (
            <div className="space-y-3">
              {pendingItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4">
                  {item.image_urls?.[0] && (
                    <img
                      src={item.image_urls[0]}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900">{item.title}</p>
                    <p className="text-sm text-stone-500">
                      {item.weight_grams}g · {item.karat}
                    </p>
                    {item.min_price && (
                      <p className="text-sm text-stone-500">
                        Minimipris: {item.min_price.toLocaleString('sv-SE')} kr
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">
                      {item.profiles?.full_name} · {item.profiles?.email}
                    </p>
                    {item.description && (
                      <p className="text-xs text-stone-400 mt-1 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <form action={approveItem.bind(null, item.id)}>
                      <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition w-full">
                        Godkänn
                      </button>
                    </form>
                    <form action={rejectItem.bind(null, item.id)}>
                      <button className="bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition w-full">
                        Neka
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
