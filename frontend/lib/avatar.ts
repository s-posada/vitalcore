// Fotos de personas reales (randomuser.me) en lugar de avatares ilustrados,
// para que la plataforma se sienta como un producto real y no un prototipo.
const MEN = [11, 12, 22, 32, 41, 52, 62, 71, 8, 91]
const WOMEN = [11, 12, 23, 33, 44, 50, 65, 71, 8, 90]

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

const TEAM_AVATARS: Record<string, string> = {
  // Catalina (Cata)
  'catalina': '/team/cata.png',
  'cata': '/team/cata.png',
  'catalina antonia vergara donoso': '/team/cata.png',
  'cavergara2019@udec.cl': '/team/cata.png',

  // Fabian
  'fabian': '/team/fabian.png',
  'fabian alonso alvarado arriagada': '/team/fabian.png',
  'falvarado2016@udec.cl': '/team/fabian.png',

  // Andy / Andres
  'andres': '/team/andy.png',
  'andy': '/team/andy.png',
  'andres gonzalo burboa lizama': '/team/andy.png',
  'andresburboa@udec.cl': '/team/andy.png',

  // Marian / Mariam
  'marian': '/team/mariam.png',
  'mariam': '/team/mariam.png',
  'marian garcia cruz': '/team/mariam.png',
  'margarcia2026@udec.cl': '/team/mariam.png',

  // Sebastian
  'sebastian': '/team/sebastian.png',
  'sebastian posada posada': '/team/sebastian.png',
  'sposada2026@udec.cl': '/team/sebastian.png',

  // Yenny
  'yenny': '/team/yenny.png',
  'yenny sanchez aguilar': '/team/yenny.png',
  'yesanchez2026@udec.cl': '/team/yenny.png',
}

/**
 * Devuelve una foto de perfil realista y estable para un mismo `seed`
 * (nombre o email). Si se conoce el género se puede fijar explícitamente.
 */
export function avatarUrl(seed: string, gender?: 'male' | 'female'): string {
  const safeSeed = (seed || 'usuario-vitalcore').trim().toLowerCase()
  for (const [key, path] of Object.entries(TEAM_AVATARS)) {
    if (safeSeed.includes(key) || key.includes(safeSeed)) {
      return path
    }
  }

  const h = hashSeed(seed || 'usuario-vitalcore')
  const isMale = gender ? gender === 'male' : h % 2 === 0
  const pool = isMale ? MEN : WOMEN
  const id = pool[h % pool.length]
  return `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${id}.jpg`
}

