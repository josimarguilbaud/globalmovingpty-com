import es from './es.json';
import en from './en.json';
import serviciosEs from '../data/servicios.es.json';
import serviciosEn from '../data/servicios.en.json';
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

/** Una sección de cuerpo de una página de servicio. */
export interface SeccionServicio {
  h2: string;
  parrafos: string[];
}

/** Un servicio con página propia. */
export interface Servicio {
  slug: string;
  icono: string;
  nav: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  entradilla: string;
  secciones: SeccionServicio[];
  incluye: string[];
  faq: { q: string; a: string }[];
}

const servicios = { es: serviciosEs, en: serviciosEn } as Record<Locale, Servicio[]>;

/**
 * El catálogo de servicios del idioma pedido.
 *
 * **El slug es el mismo en los dos idiomas** (`/servicios/almacenaje` y
 * `/en/servicios/almacenaje`), igual que en las webs hermanas de San Blas.
 * Así el par hreflang es trivial de construir y no se repite el fallo
 * documentado allí: al traducir contenido, las rutas internas se traducen con
 * él (`/precios`→`/prices`) y generan 404 que nadie ve hasta que un cliente
 * se los encuentra.
 *
 * El precio de esta decisión es que un slug en español aparece bajo `/en/`.
 * Es feo y es deliberado: un 404 cuesta más que un slug feo.
 */
export function useServicios(lang: Locale): Servicio[] {
  return servicios[lang] ?? servicios.es;
}

/** Un servicio por su slug. Lanza si no existe, para que reviente el build. */
export function useServicio(lang: Locale, slug: string): Servicio {
  const s = useServicios(lang).find((x) => x.slug === slug);
  if (!s) {
    // Un slug ausente en un idioma significa catálogos desalineados. Sin este
    // throw la página saldría en blanco y el build en verde.
    throw new Error(
      `No existe el servicio "${slug}" en "${lang}". Los dos catálogos deben llevar los mismos slugs.`,
    );
  }
  return s;
}
