// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// El español manda: la empresa es panameña y el cliente que paga busca en
// español. El inglés vive en /en/ para el expatriado y la mudanza corporativa,
// que es de donde salen los traslados grandes.
export default defineConfig({
  site: 'https://globalmovingpty.com',

  // Una sola forma canónica de cada URL: SIN barra final.
  //
  // Por defecto Astro emite `servicios/almacenaje/index.html`, que nginx sirve
  // en `/servicios/almacenaje/` y al que se llega con un 301 desde la forma sin
  // barra. El resultado era que la web daba tres respuestas distintas sobre
  // cuál es la dirección buena: el `canonical` decía sin barra (y esa
  // redirigía), el sitemap decía con barra, y los enlaces internos sin barra.
  // O sea que el canonical apuntaba a una redirección y contradecía al sitemap,
  // y cada clic interno costaba un salto de más.
  //
  // Con `format: 'file'` el build emite `servicios/almacenaje.html`, que el
  // `try_files $uri.html` de nginx sirve con 200 en la URL sin barra.
  trailingSlash: 'never',
  build: { format: 'file' },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
