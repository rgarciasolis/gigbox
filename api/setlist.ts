// Funcion serverless (Vercel): busca conciertos en setlist.fm y devuelve solo fecha, artista, sala y enlace.
//   GET /api/setlist?artist=Nombre[&date=DD-MM-YYYY][&p=1]
//
// Condiciones de uso de setlist.fm que cumple:
// - La clave (SETLISTFM_API_KEY) vive solo en el servidor; el navegador nunca la ve.
// - Los datos se pasan tal cual, sin guardarlos: solo cache corta en el CDN (10 min).
// - Se devuelve `url`, el enlace de atribucion de setlist.fm, que la interfaz debe mostrar siempre (sin nofollow).
// - No se devuelven ni se usan los temas del setlist: la interfaz solo enlaza a la pagina de setlist.fm.
// Solo uso no comercial.

interface Req {
  url?: string
}
interface Res {
  status(code: number): Res
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

interface SetlistFmItem {
  id: string
  eventDate: string // dd-MM-yyyy
  artist?: { name?: string; mbid?: string }
  venue?: { name?: string; city?: { name?: string; country?: { name?: string } } }
  url?: string
}

const BASE = 'https://api.setlist.fm/rest/1.0/search/setlists'

// dd-MM-yyyy -> yyyy-MM-dd
const toIso = (d: string) => d.split('-').reverse().join('-')

export default async function handler(req: Req, res: Res) {
  const key = process.env.SETLISTFM_API_KEY
  if (!key) return res.status(503).json({ error: 'not_configured' })

  const params = new URL(req.url ?? '', 'http://localhost').searchParams
  const artist = (params.get('artist') ?? '').trim()
  const date = params.get('date')
  const page = Number(params.get('p') ?? '1')
  if (!artist || artist.length > 100) return res.status(400).json({ error: 'artist_required' })
  if (date && !/^\d{2}-\d{2}-\d{4}$/.test(date)) return res.status(400).json({ error: 'bad_date' })
  if (!Number.isInteger(page) || page < 1 || page > 5) return res.status(400).json({ error: 'bad_page' })

  const q = new URLSearchParams({ artistName: artist, p: String(page) })
  if (date) q.set('date', date)

  let upstream: Response
  try {
    upstream = await fetch(`${BASE}?${q}`, {
      headers: { 'x-api-key': key, Accept: 'application/json', 'Accept-Language': 'es' },
    })
  } catch {
    return res.status(502).json({ error: 'upstream_unreachable' })
  }

  // setlist.fm responde 404 cuando no hay resultados
  if (upstream.status === 404) return res.status(200).json({ total: 0, page, items: [] })
  if (upstream.status === 429) return res.status(429).json({ error: 'rate_limited' })
  if (!upstream.ok) return res.status(502).json({ error: 'upstream_error', status: upstream.status })

  const body = (await upstream.json()) as { total?: number; setlist?: SetlistFmItem[] }
  const items = (body.setlist ?? []).map((s) => ({
    id: s.id,
    date: toIso(s.eventDate),
    artist: { name: s.artist?.name ?? '', mbid: s.artist?.mbid ?? null },
    venue: {
      name: s.venue?.name ?? '',
      city: s.venue?.city?.name ?? '',
      country: s.venue?.city?.country?.name ?? '',
    },
    // Enlace de atribucion: si falta, la interfaz enlaza a https://www.setlist.fm
    url: s.url ?? null,
  }))

  res.setHeader('Cache-Control', 'public, s-maxage=600')
  res.status(200).json({ total: body.total ?? items.length, page, items })
}
