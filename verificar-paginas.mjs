/**
 * Guardián de páginas vacías. Corre en el `postbuild`, sobre `dist/`.
 *
 * Existe por un fallo real: al extraer `Nav.astro` de `Home.astro` quedó un
 * `</header>` huérfano, que cancelaba el resto de la plantilla. La portada se
 * publicó con la cabecera y NADA MÁS: sin hero, sin secciones, sin pie.
 *
 * Nada lo detectó. El build salió en verde porque el HTML era válido. El
 * `verificar-servicios.mjs` mira los datos, no la salida. Y la comprobación
 * final del despliegue pedía HTTP 200 — que una página en blanco devuelve
 * perfectamente. La web estuvo rota en producción hasta que un humano la miró.
 *
 * Esto compara cada página construida contra lo que tiene que tener sí o sí.
 * No mide diseño: mide que el contenido llegó.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = './dist';
const MINIMO_PALABRAS = 120;   // hasta la página más corta pasa de largo esto

const htmls = [];
(function recorrer(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (e.endsWith('.html')) htmls.push(p);
  }
})(DIST);

/** Texto visible: fuera scripts, estilos y etiquetas. */
const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fallos = [];

for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const ruta = relative(DIST, f);
  const decir = (m) => fallos.push(`${ruta}: ${m}`);

  const h1 = html.match(/<h1[\s>]/gi)?.length ?? 0;
  if (h1 === 0) decir('no tiene <h1>');
  if (h1 > 1) decir(`tiene ${h1} <h1>, debe haber uno`);

  if (!/<footer[\s>]/i.test(html)) decir('no tiene <footer> (la plantilla se cortó antes de terminar)');
  if (!/<header[\s>]/i.test(html)) decir('no tiene <header>');

  const palabras = visible(html).split(' ').filter(Boolean).length;
  if (palabras < MINIMO_PALABRAS) decir(`solo ${palabras} palabras visibles, el mínimo es ${MINIMO_PALABRAS}`);

  // Etiquetas de bloque descuadradas: es exactamente la firma del fallo que
  // motivó este guion. Un cierre de más cancela todo lo que viene detrás.
  for (const t of ['header', 'footer', 'section', 'article', 'main']) {
    const abre = html.match(new RegExp(`<${t}[\\s>]`, 'gi'))?.length ?? 0;
    const cierra = html.match(new RegExp(`</${t}>`, 'gi'))?.length ?? 0;
    if (abre !== cierra) decir(`<${t}> descuadrado: abre ${abre}, cierra ${cierra}`);
  }

  if (!/<title>[^<]+<\/title>/i.test(html)) decir('no tiene <title> con contenido');
  if (!/name="description" content="[^"]+"/i.test(html)) decir('no tiene meta description');
}

if (fallos.length) {
  console.error(`\n✖ verificar-paginas: ${fallos.length} problema(s) en ${htmls.length} páginas\n`);
  for (const f of fallos) console.error(`  ${f}`);
  console.error('\nUna página que devuelve 200 puede estar vacía. Eso ya pasó.\n');
  process.exit(1);
}

console.log(`✓ verificar-paginas: ${htmls.length} páginas con contenido, marcado equilibrado`);
