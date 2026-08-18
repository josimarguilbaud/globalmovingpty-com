import { SITE_URL, EMPRESA, langUrl, type Locale } from './site';
import { useDict } from '../i18n';

/**
 * Los seis servicios, declarados como `Service`.
 *
 * Cada uno es un servicio que la empresa presta de verdad y que además está
 * escrito en la página: mudanza internacional, oficinas, mascotas, almacenaje,
 * consolidación marítima Panamá-Miami y seguros. Google los puede mostrar como
 * lista de servicios del negocio, y la web anterior no declaraba ninguno.
 *
 * Regla que no se salta: solo entra aquí lo que el visitante VE en la página.
 * Marcado sin contenido visible es lo que Google penaliza.
 */
export function serviciosJsonLd(lang: Locale) {
  const t = useDict(lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.servicios.h2,
    itemListElement: t.servicios.items.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.t,
        description: s.d,
        serviceType: s.t,
        provider: { '@id': `${SITE_URL}/#negocio` },
        areaServed: { '@type': 'Country', name: 'Panamá' },
        url: `${SITE_URL}${langUrl(lang, '/')}#servicios`,
      },
    })),
  };
}

/** Migas de pan. Hoy solo hay portada; queda listo para las páginas internas. */
export function breadcrumbJsonLd(lang: Locale, items: { nombre: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
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
