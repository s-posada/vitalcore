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

/**
 * Devuelve una foto de perfil realista y estable para un mismo `seed`
 * (nombre o email). Si se conoce el género se puede fijar explícitamente.
 */
export function avatarUrl(seed: string, gender?: 'male' | 'female'): string {
  const safeSeed = seed || 'usuario-vitalcore'
  const h = hashSeed(safeSeed)
  const isMale = gender ? gender === 'male' : h % 2 === 0
  const pool = isMale ? MEN : WOMEN
  const id = pool[h % pool.length]
  return `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${id}.jpg`
}
