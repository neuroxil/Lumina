import {
  si1password,
  siAirbnb,
  siAnthropic,
  siApple,
  siAsana,
  siAtlassian,
  siAuth0,
  siBinance,
  siBitbucket,
  siBitwarden,
  siBluesky,
  siCloudflare,
  siCoinbase,
  siCursor,
  siDashlane,
  siDigitalocean,
  siDiscord,
  siDocker,
  siDropbox,
  siEa,
  siEpicgames,
  siFacebook,
  siFigma,
  siGithub,
  siGitlab,
  siGmail,
  siGoogledrive,
  siGoogle,
  siHetzner,
  siIcloud,
  siInstagram,
  siJira,
  siKick,
  siLastpass,
  siLinear,
  siMega,
  siMeta,
  siMullvad,
  siNamecheap,
  siNetflix,
  siNetlify,
  siNextdns,
  siNextcloud,
  siNordvpn,
  siNotion,
  siNpm,
  siNvidia,
  siOkta,
  siPaypal,
  siPlaystation,
  siPlex,
  siProton,
  siProtonmail,
  siProtonvpn,
  siReddit,
  siRiotgames,
  siRoblox,
  siRockstargames,
  siShopify,
  siSignal,
  siSnapchat,
  siSpotify,
  siSquareenix,
  siSteam,
  siStripe,
  siSupabase,
  siTailscale,
  siTelegram,
  siTiktok,
  siTrello,
  siTwitch,
  siUber,
  siUbisoft,
  siVercel,
  siWhatsapp,
  siX,
  siYoutube,
  siZoom
} from 'simple-icons'
import custom from './custom-icons.json'

export interface BrandMark {
  title: string
  hex: string
  path: string
}

interface IconLike {
  title: string
  hex: string
  path: string
  slug?: string
}

interface Brand {
  icon: IconLike
  aliases: string[]
}

function fromSimple(icon: { title: string; hex: string; path: string; slug: string }, aliases: string[]): Brand {
  return { icon: { title: icon.title, hex: `#${icon.hex}`, path: icon.path, slug: icon.slug }, aliases }
}

function fromCustom(key: keyof typeof custom, title: string, aliases: string[]): Brand {
  const icon = custom[key]
  return { icon: { title, hex: icon.hex, path: icon.path, slug: key }, aliases }
}

const brands: Brand[] = [
  fromSimple(siGoogle, ['google', 'google.com', 'accounts.google.com', 'gcp', 'googlecloud', 'google workspace']),
  fromSimple(siGmail, ['gmail', 'googlemail']),
  fromSimple(siGoogledrive, ['googledrive', 'gdrive', 'drive.google']),
  fromSimple(siYoutube, ['youtube', 'youtubetv']),
  fromSimple(siGithub, ['github', 'github.com', 'gh']),
  fromSimple(siGitlab, ['gitlab', 'gitlab.com']),
  fromSimple(siBitbucket, ['bitbucket']),
  fromSimple(siDiscord, ['discord']),
  fromSimple(siSteam, ['steam', 'steampowered', 'steamcommunity']),
  fromCustom('microsoft', 'Microsoft', [
    'microsoft',
    'outlook',
    'hotmail',
    'live.com',
    'office',
    'office365',
    'microsoft365',
    'onedrive',
    'azure'
  ]),
  fromCustom('xbox', 'Xbox', ['xbox']),
  fromSimple(siApple, ['apple', 'appleid', 'apple.com']),
  fromSimple(siIcloud, ['icloud']),
  fromCustom('amazon', 'Amazon', ['amazon', 'amazon.com']),
  fromCustom('amazonaws', 'AWS', ['aws', 'amazonwebservices', 'amazonaws']),
  fromSimple(siFacebook, ['facebook', 'fb']),
  fromSimple(siMeta, ['meta']),
  fromSimple(siInstagram, ['instagram', 'ig']),
  fromSimple(siX, ['twitter', 'x.com']),
  fromCustom('linkedin', 'LinkedIn', ['linkedin']),
  fromSimple(siReddit, ['reddit']),
  fromSimple(siTwitch, ['twitch']),
  fromSimple(siTiktok, ['tiktok']),
  fromSimple(siSnapchat, ['snapchat']),
  fromSimple(siTelegram, ['telegram']),
  fromSimple(siWhatsapp, ['whatsapp']),
  fromSimple(siSignal, ['signal']),
  fromCustom('slack', 'Slack', ['slack']),
  fromSimple(siNotion, ['notion']),
  fromSimple(siDropbox, ['dropbox']),
  fromSimple(siCloudflare, ['cloudflare']),
  fromSimple(siDigitalocean, ['digitalocean']),
  fromSimple(siStripe, ['stripe']),
  fromSimple(siPaypal, ['paypal']),
  fromSimple(siCoinbase, ['coinbase']),
  fromSimple(siBinance, ['binance']),
  fromSimple(siProton, ['proton']),
  fromSimple(siProtonmail, ['protonmail', 'proton.me', 'pm.me']),
  fromSimple(siProtonvpn, ['protonvpn']),
  fromSimple(siBitwarden, ['bitwarden']),
  fromSimple(si1password, ['1password', 'onepassword']),
  fromSimple(siLastpass, ['lastpass']),
  fromSimple(siDashlane, ['dashlane']),
  fromSimple(siAuth0, ['auth0']),
  fromSimple(siOkta, ['okta']),
  fromCustom('adobe', 'Adobe', ['adobe']),
  fromSimple(siNetflix, ['netflix']),
  fromSimple(siSpotify, ['spotify']),
  fromSimple(siPlaystation, ['playstation', 'psn']),
  fromCustom('nintendo', 'Nintendo', ['nintendo', 'nintendoswitch']),
  fromSimple(siEpicgames, ['epic', 'epicgames', 'fortnite']),
  fromSimple(siRiotgames, ['riot', 'riotgames', 'leagueoflegends', 'valorant']),
  fromSimple(siUbisoft, ['ubisoft']),
  fromSimple(siEa, ['ea', 'electronicarts', 'origin']),
  fromSimple(siRoblox, ['roblox']),
  fromSimple(siRockstargames, ['rockstar', 'rockstargames']),
  fromSimple(siSquareenix, ['squareenix', 'square enix']),
  fromSimple(siNpm, ['npm']),
  fromSimple(siDocker, ['docker']),
  fromSimple(siVercel, ['vercel']),
  fromSimple(siNetlify, ['netlify']),
  fromCustom('heroku', 'Heroku', ['heroku']),
  fromSimple(siHetzner, ['hetzner']),
  fromSimple(siNamecheap, ['namecheap']),
  fromSimple(siFigma, ['figma']),
  fromSimple(siLinear, ['linear']),
  fromSimple(siJira, ['jira']),
  fromSimple(siTrello, ['trello']),
  fromSimple(siAtlassian, ['atlassian', 'confluence']),
  fromSimple(siAsana, ['asana']),
  fromSimple(siZoom, ['zoom']),
  fromCustom('openai', 'OpenAI', ['openai', 'chatgpt', 'chat.openai']),
  fromSimple(siAnthropic, ['anthropic', 'claude']),
  fromSimple(siCursor, ['cursor']),
  fromSimple(siNvidia, ['nvidia']),
  fromSimple(siSupabase, ['supabase']),
  fromSimple(siTailscale, ['tailscale']),
  fromSimple(siMullvad, ['mullvad']),
  fromSimple(siNordvpn, ['nordvpn']),
  fromSimple(siNextdns, ['nextdns']),
  fromSimple(siNextcloud, ['nextcloud']),
  fromSimple(siMega, ['mega', 'mega.nz']),
  fromSimple(siPlex, ['plex']),
  fromSimple(siAirbnb, ['airbnb']),
  fromSimple(siUber, ['uber']),
  fromSimple(siShopify, ['shopify']),
  fromSimple(siKick, ['kick']),
  fromSimple(siBluesky, ['bluesky', 'bsky'])
]

function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

export function resolveLogo(issuer: string, name = ''): BrandMark | null {
  const hay = `${issuer} ${name}`.trim()
  if (!hay) return null
  const hayCompact = compact(hay)
  const hayTokens = new Set(tokens(hay))

  let best: { icon: IconLike; score: number } | null = null
  for (const brand of brands) {
    const aliases = [...brand.aliases, brand.icon.slug ?? '', brand.icon.title]
    for (const alias of aliases) {
      const aCompact = compact(alias)
      if (!aCompact) continue
      let score = 0
      if (hayTokens.has(alias.toLowerCase()) || hayTokens.has(aCompact)) score = 100 + aCompact.length
      else if (hayCompact === aCompact) score = 90 + aCompact.length
      else if (aCompact.length >= 4 && hayCompact.includes(aCompact)) score = 50 + aCompact.length
      if (score && (!best || score > best.score)) best = { icon: brand.icon, score }
    }
  }
  if (!best) return null
  return { title: best.icon.title, hex: best.icon.hex, path: best.icon.path }
}

export function markContrast(hex: string): { bg: string; fg: string } {
  const raw = hex.replace('#', '')
  const n = Number.parseInt(raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return { bg: hex.startsWith('#') ? hex : `#${hex}`, fg: luma > 0.62 ? '#12141c' : '#ffffff' }
}
