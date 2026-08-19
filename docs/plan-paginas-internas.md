# Plan — páginas internas, blog y enlazado para globalmovingpty.com

Rama: `main` · Repo: `josimarguilbaud/globalmovingpty-com` · Astro 7 + Tailwind 4 · es (raíz) / en (`/en/`)

## El problema

La web tiene **dos páginas**: `/` y `/en/`. El sitemap publicado lo confirma. Los 9
servicios viven en tarjetas `<article>` sin enlace dentro de un `#servicios` de la
portada, así que:

- No hay ninguna URL que pueda posicionar por «mudanza de mascotas Panamá»,
  «almacenaje de menaje Panamá» o «consolidación Panamá Miami». Las nueve consultas
  compiten desde un mismo documento, que además ya está optimizado para la genérica
  «mudanzas internacionales en Panamá».
- El menú son cuatro anclas. No hay dropdown porque no hay nada que desplegar.
- El footer lista 5 servicios como texto plano, sin enlace, y **no lleva NAP**
  (nombre, dirección, teléfono, horario) en texto visible. Esa señal solo existe hoy
  dentro del JSON-LD.

El encargo original decía «full seo paginas internas secciones imagenes blog español
ingles». Lo desplegado es el port de la plantilla de una sola página. Esto cierra el hueco.

## Lo que ya existe y se reusa (no se reinventa)

El patrón está resuelto y en producción en `chatbot-sanblas/sites/sanblastourspty`:

| Pieza | Dónde vive hoy | Cómo se porta aquí |
|---|---|---|
| Datos por idioma | `src/data/tours.<lang>.json` | `src/data/servicios.<lang>.json` |
| Página por ítem | `pages/tours/[slug].astro` + `[lang]/tours/[slug].astro` | `pages/servicios/[slug].astro` + `en/servicios/[slug].astro` |
| Componente de página | `components/TourPage.astro` | `components/ServicioPage.astro` |
| Blog | content collection `glob('**/*.md', base:'./src/content/blog')`, id `lang/slug` | idéntico |
| Índice y post | `BlogIndexPage.astro` / `BlogPostPage.astro` | idéntico |
| Nav y Footer | `Nav.astro` / `Footer.astro` extraídos | hoy están inline en `Home.astro` |

`Home.astro` es hoy un monolito con el nav, la portada y el footer dentro. Extraer
`Nav.astro` y `Footer.astro` es prerrequisito: si no, cada página interna duplicaría
cabecera y pie.

## Alcance propuesto

### E1 — Extraer Nav y Footer de `Home.astro`
Prerrequisito de todo lo demás. Sin estado nuevo, solo mover marcado.

### E2 — Datos de servicio (`src/data/servicios.<lang>.json`)
Un registro por servicio: `slug`, `titulo`, `metaTitle`, `metaDescription`, `h1`,
`entradilla`, secciones de cuerpo, `incluye[]`, `faq[]`, `imagen`. **El slug es el
mismo en los dos idiomas** (igual que las hermanas), para no repetir el fallo
documentado de rutas traducidas que generan 404.

### E3 — 9 páginas de servicio × 2 idiomas (18 URLs)
`ServicioPage.astro` + `getStaticPaths` desde los datos. Cada una con su `Service`
JSON-LD propio, `BreadcrumbList`, canonical y hreflang.

### E4 — Nav con dropdown de Servicios
Desktop: dropdown accesible por teclado (`aria-expanded`, Escape cierra, foco
visible). Móvil: acordeón dentro del menú existente. **Sin JS el dropdown debe seguir
siendo navegable** — el enlace padre lleva a `/servicios`.

### E5 — Índice de servicios `/servicios` y `/en/services`
Necesario para que el dropdown tenga padre y para dar un nodo de enlazado interno.

### E6 — Footer con NAP y enlaces reales
Teléfono, correo, dirección y horario en texto visible. Los 9 servicios enlazados.
Bajar los `<h2>` del pie a `<h3>`.

### E7 — Blog es/en
Content collection, índice y post. Arranque con 6 artículos por idioma que respondan
consultas informativas y enlacen a la página de servicio que corresponda.

### E8 — Guardián anti-canibalización interna
Script en `prebuild` que rompe el build si dos páginas de servicio comparten
`metaTitle`, `metaDescription` o H1, y si alguna repite el `<title>` de la portada.
Existe porque el fallo se reintroduce solo al copiar secciones entre páginas: es
exactamente lo que tumbó a sanblasfull en agosto.

## Riesgos conocidos

1. **Canibalización interna.** Nueve páginas del mismo dominio sobre mudanzas se
   solapan por defecto. Cada una tiene que atacar una consulta distinta y decirlo con
   palabras distintas, no ser la misma página con el nombre cambiado.
2. **Contenido delgado.** 18 URLs con 4 párrafos cada una es peor que 2 URLs buenas:
   Google las trata como thin content. Cada página necesita cuerpo real.
3. **La portada compite con `/servicios`.** Hay que decidir qué consulta lleva cada una.
4. **Traducción.** El repo documenta que DeepL traduce rutas internas y nombres
   propios. El texto visible más importante se escribe a mano.

## Fuera de alcance

- Rediseño visual: la plantilla ya está aprobada.
- Formulario a CRM o correo: hoy va a WhatsApp por decisión previa.
- Más idiomas: es/en.
