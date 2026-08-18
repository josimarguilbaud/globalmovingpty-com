import es from './es.json';
import en from './en.json';
import type { Locale } from '../lib/site';

const dicts = { es, en } as const;

/**
 * El diccionario del idioma pedido.
 *
 * Sin fallback silencioso: si falta una clave en inglés se ve en el build, no
 * en producción. En las webs de San Blas el fallback automático al español dejó
 * páginas «traducidas» que salían en español y nadie lo notó durante semanas.
 */
export function useDict(lang: Locale) {
  return dicts[lang] ?? dicts.es;
}

export type Dict = typeof es;
