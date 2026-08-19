import { SITE_URL, EMPRESA, langUrl, type Locale } from './site';
import { useDict, useServicios } from '../i18n';

/**
 * Los servicios del catalogo, declarados como `Service`.
 *
 * La lista sale de `src/data/servicios.<lang>.json`, la misma que alimenta las
 * fichas y el desplegable, asi que anadir un servicio lo mete en el marcado sin
 * tocar este fichero. Cada `Service` apunta a SU pagina, no a un ancla de la
 * portada: un ancla no es un recurso distinto para Google.
 *
 * Regla que no se salta: solo entra aquí lo que el visitante VE en la página.
 * Marcado sin contenido visible es lo que Google penaliza.
 */
export function serviciosJsonLd(lang: Locale) {
  const t = useDict(lang);
  const servicios = useServicios(lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.servicios.h2,
    itemListElement: servicios.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.titulo,
        description: s.resumen,
        serviceType: s.titulo,
        provider: { '@id': `${SITE_URL}/#negocio` },
        areaServed: { '@type': 'Country', name: 'Panamá' },
        url: `${SITE_URL}${langUrl(lang, `/servicios/${s.slug}`)}`,
      },
    })),
  };
}

/**
 * Migas de pan.
 *
 * Sin `@context` porque siempre se inserta dentro de un `@graph` que ya lo
 * declara; repetirlo dentro de un nodo del grafo es ruido.
 */
export function breadcrumbJsonLd(lang: Locale, items: { nombre: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nombre,
      item: `${SITE_URL}${langUrl(lang, it.path)}`,
    })),
  };
}

export { EMPRESA };
