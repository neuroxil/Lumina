const COLORS = [
  '#7CFFF2',
  '#C9A8FF',
  '#FFB4E0',
  '#9BE7FF',
  '#B8F2C9',
  '#FFD59E',
  '#F6A6FF',
  '#A7C4FF'
]

const KNOWN: Record<string, string> = {
  github: '#E6EDF3',
  gitlab: '#FC6D26',
  google: '#7CFFF2',
  discord: '#A7B4FF',
  steam: '#9BE7FF',
  microsoft: '#9BE7FF',
  apple: '#F4F7FB',
  proton: '#C9A8FF',
  amazon: '#FFD59E',
  aws: '#FFD59E',
  cloudflare: '#FFD59E',
  twitter: '#9BE7FF',
  x: '#E6EDF3',
  facebook: '#A7C4FF',
  instagram: '#FFB4E0',
  reddit: '#FFD59E',
  twitch: '#C9A8FF',
  slack: '#F6A6FF',
  notion: '#F4F7FB',
  dropbox: '#9BE7FF',
  digitalocean: '#7CFFF2',
  stripe: '#C9A8FF',
  paypal: '#A7C4FF',
  coinbase: '#7CFFF2',
  binance: '#FFD59E',
  telegram: '#9BE7FF',
  whatsapp: '#B8F2C9',
  linkedin: '#A7C4FF',
  adobe: '#FFB4E0',
  netflix: '#FFB4E0',
  spotify: '#B8F2C9',
  bitwarden: '#A7C4FF',
  '1password': '#7CFFF2'
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0
  return h
}

export function issuerColor(issuer: string): string {
  const key = issuer.trim().toLowerCase()
  if (KNOWN[key]) return KNOWN[key]
  return COLORS[hash(key || 'account') % COLORS.length]
}

export function issuerInitials(issuer: string, name?: string): string {
  const source = (issuer || name || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
