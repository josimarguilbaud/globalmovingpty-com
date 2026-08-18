// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// El español manda: la empresa es panameña y el cliente que paga busca en
// español. El inglés vive en /en/ para el expatriado y la mudanza corporativa,
// que es de donde salen los traslados grandes.
export default defineConfig({
  site: 'https://globalmovingpty.com',

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
