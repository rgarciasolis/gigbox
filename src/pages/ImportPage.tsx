import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBox } from '@/components/ui'
import { useConfirmImport, useParseEmail, useSampleEmail } from '@/data/hooks'
import type { ImportCandidate } from '@/domain/views'

type Row = ImportCandidate & { include: boolean }

export default function ImportPage() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const parse = useParseEmail()
  const sample = useSampleEmail()
  const confirm = useConfirmImport()

  if (confirm.isSuccess) {
    return (
      <div className="card text-center">
        <h1 className="h1">Importación completada</h1>
        <p className="text-sm">{confirm.data.created} conciertos añadidos · {confirm.data.skipped} omitidos (duplicados o sin coincidencia).</p>
        <div className="mt-3 flex justify-center gap-2">
          <Link className="btn btn-primary" to="/perfil/gigs">Ver mis gigs</Link>
          <button className="btn" onClick={() => { confirm.reset(); parse.reset(); setRows(null); setText('') }}>Importar otro email</button>
        </div>
      </div>
    )
  }

  const upd = (id: string, p: Partial<Row>) => setRows((r) => r && r.map((x) => (x.id === id ? { ...x, ...p } : x)))

  if (rows) {
    const selected = rows.filter((r) => r.include)
    return (
      <div>
        <h1 className="h1">Revisar conciertos detectados</h1>
        {rows.length === 0 ? (
          <div className="card muted">No se detectó ningún concierto. <button className="underline" onClick={() => setRows(null)}>Volver</button></div>
        ) : (
          <>
            <p className="muted mb-3">Confirma o corrige cada concierto. Los duplicados vienen desmarcados.</p>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className={`card ${r.duplicateOfAttendanceId ? 'border-amber-300 bg-amber-50' : ''}`}>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" checked={r.include} onChange={(e) => upd(r.id, { include: e.target.checked })} />
                    <span className="flex-1">
                      <span className="grid gap-1 sm:grid-cols-3">
                        <input className="input" aria-label="Artista" value={r.artistName} onChange={(e) => upd(r.id, { artistName: e.target.value })} />
                        <input className="input" aria-label="Sala" value={r.venueName} onChange={(e) => upd(r.id, { venueName: e.target.value })} />
                        <input type="date" className="input" aria-label="Fecha" value={r.date} onChange={(e) => upd(r.id, { date: e.target.value })} />
                      </span>
                      <span className="muted mt-1 block">Detectado en: “{r.snippet}” · confianza {Math.round(r.confidence * 100)}%</span>
                      {r.duplicateOfAttendanceId && <span className="mt-1 block text-sm text-amber-800">Posible duplicado: ya tienes este concierto registrado.</span>}
                      {!r.matchedGigId && <span className="mt-1 block text-sm text-red-700">Sin coincidencia en el catálogo: no se podrá importar.</span>}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            {confirm.isError && <div className="mt-2"><ErrorBox error={confirm.error} /></div>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary" disabled={selected.length === 0 || confirm.isPending} onClick={() => confirm.mutate({ candidates: selected })}>
                {confirm.isPending ? 'Importando…' : `Importar ${selected.length} concierto${selected.length === 1 ? '' : 's'}`}
              </button>
              <button className="btn" onClick={() => setRows(null)}>Volver</button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className="h1">Importación masiva <span className="muted">Plus · simulada</span></h1>
      <p className="muted mb-3">Pega el texto de un email de entradas o sube un archivo .txt/.eml. La detección es de mentira (dummy).</p>
      <textarea className="input" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí el email…" aria-label="Email" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="file" accept=".txt,.eml,text/plain" className="text-sm" aria-label="Subir email"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()) }} />
        <button className="btn" disabled={sample.isPending} onClick={async () => setText(await sample.mutateAsync())}>Usar email de ejemplo</button>
        <button className="btn btn-primary ml-auto" disabled={parse.isPending}
          onClick={async () => { const res = await parse.mutateAsync(text); setRows(res.candidates.map((c) => ({ ...c, include: !c.duplicateOfAttendanceId && !!c.matchedGigId }))) }}>
          {parse.isPending ? 'Analizando…' : 'Detectar conciertos'}
        </button>
      </div>
      {(parse.isError || sample.isError) && <div className="mt-2"><ErrorBox error={parse.error ?? sample.error} /></div>}
    </div>
  )
}
