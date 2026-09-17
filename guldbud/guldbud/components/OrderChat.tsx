'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Msg = { id: string; sender_id: string; party: string; body: string; created_at: string }

function time(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// A single message thread for an order. `party` selects which side ('seller'
// or 'dealer'). `meId` is the current user's id; `isAdmin` styles admin bubbles.
export default function OrderChat({
  orderId,
  party,
  meId,
  isAdmin,
  counterpartLabel,
}: {
  orderId: string
  party: 'seller' | 'dealer'
  meId: string
  isAdmin: boolean
  counterpartLabel: string
}) {
  const supabase = createClient()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [sendError, setSendError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .eq('party', party)
      .order('created_at', { ascending: true })
    setMsgs(data || [])
    setLoaded(true)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`order-msg-${orderId}-${party}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
        (payload: any) => {
          if (payload.new.party === party) setMsgs((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new]))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, party])

  // Skrolla bara chattrutan, aldrig sidan. Tidigare låg en tom div sist i
  // listan och effekten anropade scrollIntoView på den. scrollIntoView
  // skrollar varje skrollbar förälder, alltså även fönstret, så varje
  // affärssida öppnades hoppad ner till chatten längst ner. Uppmätt i
  // headless Chromium vid 390 px: window.scrollY 2211 före, 0 efter, med
  // rutan i botten i båda fallen. scrollTop på behållaren rör bara den.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs.length])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setSending(true)
    setSendError('')
    const { error } = await supabase.from('order_messages').insert({
      order_id: orderId,
      sender_id: meId,
      party,
      body,
    })
    if (error) setSendError('Meddelandet kunde inte skickas. Försök igen.')
    else setText('')
    setSending(false)
  }

  return (
    <div className="rounded-2xl border border-espresso-100 bg-white overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-espresso-100 bg-espresso-50/60">
        <p className="text-sm font-medium text-espresso-800">
          {isAdmin ? `Konversation med ${counterpartLabel}` : 'Meddelanden med GuldBud'}
        </p>
      </div>

      <div ref={listRef} className="flex-1 max-h-80 overflow-y-auto p-4 flex flex-col gap-3">
        {!loaded ? (
          <div className="h-16 rounded-xl skeleton" />
        ) : msgs.length === 0 ? (
          <p className="text-center text-espresso-300 text-sm py-6">Inga meddelanden än.</p>
        ) : (
          msgs.map((m) => {
            const mine = m.sender_id === meId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? 'bg-gold-sheen text-espresso-900' : 'bg-espresso-100 text-espresso-800'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {/* 11 px, inte 10: tidsstämplarna var den enda texten under 11 px på affärssidorna. */}
                  <p className={`text-[11px] mt-1 ${mine ? 'text-espresso-900/50' : 'text-espresso-400'}`}>
                    {time(m.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {sendError && <p className="px-3 pt-2 text-xs text-red-600">{sendError}</p>}
      {/* min-w-0 på inputen: utan den är radens min-content 349 px i 328 px vid
          360 px bredd, och hela kortet klipps (scrollWidth 337 > 326). */}
      <div className="p-3 border-t border-espresso-100 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Skriv ett meddelande..."
          className="flex-1 min-w-0 text-sm"
        />
        <button onClick={send} disabled={sending || !text.trim()} className="btn-gold whitespace-nowrap !px-4 !py-2">
          {sending ? '...' : 'Skicka'}
        </button>
      </div>

      {/*
        Svarslöftet står som fast text, inte som ett robotsvar i tråden.
        Trådens innehåll är affärens kommunikationsprotokoll och används vid
        tvist, så ett automatiskt meddelande hade legat kvar där som om en
        människa svarat. Det hade dessutom gått genom notify_order_message och
        mejlat parten om ett svar som ingen skrivit.

        Första halvan är ett påstående om systemet, inte ett löfte: triggern
        notify_order_message skapar en notis till varje admin vid meddelande
        från en part, och notisen går vidare till mejl.
      */}
      {!isAdmin && (
        <p className="px-3 pb-3 -mt-1 text-xs text-espresso-400">
          Vi ser ditt meddelande direkt och svarar normalt samma dag.
        </p>
      )}
    </div>
  )
}
