# globalmovingpty.com

Web de **Global Moving Solutions PTY**, mudanzas internacionales desde Panamá.
Astro estático, español e inglés, servida por nginx en Netcup.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

## De dónde sale este diseño

Del HTML que aprobó el dueño (`global_moving_redesign.html`, 18/08/2026). Se
portó sección por sección conservando la estructura y la paleta, y arreglando lo
que no podía salir a producción tal cual:

| En la plantilla | Aquí |
|---|---|
| `<h1>` con `opacity:0` hasta que corriera el JS | Hero visible siempre. Solo se anima lo de bajo el pliegue |
| Tailwind por CDN (`cdn.tailwindcss.com`) | Compilado. El CDN compila en el navegador de cada visitante |
| Font Awesome en su versión **JS** (~500 KB para 15 iconos) | SVG inline, ~200 bytes cada uno, sin dependencia externa |
| Fotos de Unsplash | Tres, comprimidas y recortadas (461 KB en total). Ver abajo |
| Formulario con `action="#"` y un `setTimeout` que fingía enviar | Abre WhatsApp con la solicitud escrita |
| Sin schema, sin hreflang, sin meta description | `MovingCompany` + `ItemList` de servicios, hreflang es/en, description |
| Solo español | Español (raíz) e inglés (`/en/`) |

⚠️ **El H1 invisible no es un detalle.** La web anterior de San Blas perdió el
top 1 de Google por datos estructurados que se quedaron por el camino en un port
igual que este. Aquí el contenido se ve aunque el JavaScript no llegue nunca.

## Lo que falta y solo puede aportar el dueño

1. **Fotos reales.** Las tres que hay (`hero-contenedores.jpg`, `carga-maritima.jpg`,
   `bodega.jpg`) son de Unsplash, no de la empresa: puerto, buque y bodega, que
   ilustran el sector sin fingir que son las instalaciones propias. Por eso no
   sale ninguna con personas — una foto de «nuestro equipo» que no es el equipo
   es lo unico que aqui seria mentira. En cuanto haya fotos propias del personal
   embalando, entran en el hueco de Nosotros y esta nota desaparece.
2. **Logo.** Los dos que hay en la web actual son PNG grises de baja resolución
   (`logo_global1_black.png`, `logo_global_mundo1.png`). Ahora mismo la marca se
   dibuja con el icono de globo. Si existe una versión vectorial, entra aquí.
3. **Confirmar el destino del formulario.** Hoy abre WhatsApp al
   `+507 6503-1797`. Si se prefiere que además entre a un CRM o a un correo,
   hay que decidirlo: en estático no hay servidor que reciba el POST.

## Datos del negocio

Viven en `src/lib/site.ts`, **en un solo sitio**. Si cambia un teléfono se
cambia ahí y se corrige en la web y en el JSON-LD a la vez. En la web anterior
del grupo el número visible y el del enlace no coincidían, así que quien lo
marcaba a mano llamaba a un número inexistente.

## Idiomas

`src/i18n/es.json` y `en.json`. El español manda (la empresa es panameña) y vive
en la raíz; el inglés en `/en/`. **Sin fallback silencioso**: si falta una clave
en inglés el build falla, en vez de servir una página «traducida» que sale en
español, que es lo que pasó en las webs de San Blas sin que nadie lo notara.

## SEO

- `MovingCompany` con dirección, teléfono, horario y área servida.
- `ItemList` con los 9 servicios, cada uno como `Service`. La lista sale del
  diccionario: al anadir uno hay que anadir tambien su icono en `iconosServicio`
  (`Home.astro`), o el hueco se pinta con un SVG vacio sin avisar.
- hreflang es/en + x-default, canonical, meta description, Open Graph.
- Sitemap automático.

⚠️ **No hay `aggregateRating` y es a propósito.** Google exige reseñas reales y
visibles en la página para mostrarlo; declarar una nota sin ellas arriesga el
resultado enriquecido entero. Las cifras del hero («+20 años») son texto.

## Despliegue

Push a `main` publica solo (`.github/workflows/deploy.yml`), igual que
sanblastourspanama y remodelacionesjg: llave SSH restringida a un único comando
en Netcup, porque el panel de Coolify está cerrado a internet a propósito.

Falta crear la app en Coolify y poner su UUID en el workflow.
