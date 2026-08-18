/**
 * Los datos del negocio, en un solo sitio.
 *
 * Salieron de la plantilla que aprobó el dueño, no inventados. Si cambia un
 * teléfono se cambia AQUÍ y se arregla en toda la web y en el JSON-LD a la vez:
 * en la web anterior el número visible y el del enlace no coincidían y quien lo
 * marcaba a mano llamaba a un número que no existe.
 */
export const SITE_URL = 'https://globalmovingpty.com';

export const EMPRESA = {
  nombre: 'Global Moving Solutions',
  nombreCorto: 'Global Moving',
  bajada: 'Solutions Panamá',
  email: 'marcos@globalmovingpty.com',
  telefono: '+507 399-7988',
  telefonoRaw: '+5073997988',
  movil: '+507 6503-1797',
  movilRaw: '+50765031797',
  whatsapp: '50765031797',
  ciudad: 'Ciudad de Panamá',
  pais: 'PA',
  anios: 20,
} as const;

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];

/** Ruta con prefijo de idioma. El español vive en la raíz. */
export function langUrl(lang: Locale, path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return lang === 'es' ? p : `/${lang}${p === '/' ? '' : p}`;
}

/**
 * Enlace de WhatsApp con el mensaje ya escrito.
 *
 * En Panamá el cierre ocurre por WhatsApp, no por formulario: un correo a un
 * buzón que nadie mira pierde el cliente. Por eso el formulario de la web
 * también termina aquí (ver ContactSection).
 */
export function waLink(mensaje: string): string {
  return `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
