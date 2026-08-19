/**
 * Guardián anti-canibalización interna. Corre en el `prebuild`.
 *
 * Nueve páginas del mismo dominio hablando de mudanzas se solapan por defecto.
 * Si dos dicen lo mismo, Google elige una y descarta la otra, y el trabajo de
 * escribir la segunda se pierde entero. Eso ya pasó entre sanblasfull.com y
 * sanblastourspty.com: nueve textos del `<head>` idénticos byte a byte y una
 * de las dos webs cayó de posiciones sin que nada estuviera «roto».
 *
 * Este guion rompe el build antes que después. Comprueba cuatro cosas:
 *
 *   1. Metas y H1 idénticos entre servicios del mismo idioma.
 *   2. Que ningún servicio repita el `<title>` o la descripción de la portada.
 *   3. Similitud de CUERPO, no solo de metadatos. Es la comprobación que de
 *      verdad importa: las metas se escriben con cuidado y raramente colisionan,
 *      pero el cuerpo se copia entre páginas hermanas todo el tiempo. El
 *      guardián de San Blas solo miraba metas y por eso dejó pasar 220 claves
 *      idénticas durante meses.
 *   4. Contenido delgado: una plantilla rellenada nueve veces produce nueve
 *      páginas cortas que Google trata como una sola.
 *
 * Similitud por shingles de 4 palabras + Jaccard, que es lo mismo que usa
 * `sites/contar-duplicados.mjs` en el repo de San Blas.
 */
import { readFileSync } from 'node:fs';

const IDIOMAS = ['es', 'en'];
const UMBRAL_SIMILITUD = 0.22;   // por encima de esto, dos cuerpos se parecen demasiado
const MINIMO_PALABRAS = 320;     // por debajo de esto, es contenido delgado

/**
 * Pares perdonados, con su motivo.
 *
 * Vacío a propósito. Si algún día hay que perdonar un par, va aquí CON el
 * motivo escrito: un umbral que se sube en silencio para que pase el build
 * convierte al guardián en decoración.
 */
const PERDONADOS = [
  // { a: 'slug-uno', b: 'slug-dos', porque: '...' },
];

const norm = (s) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const shingles = (texto, n = 4) => {
  const p = norm(texto).split(' ').filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= p.length; i++) out.add(p.slice(i, i + n).join(' '));
  return out;
};

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let comunes = 0;
  for (const x of a) if (b.has(x)) comunes++;
  return comunes / (a.size + b.size - comunes);
};

const cuerpoDe = (s) =>
  [
    s.entradilla,
    ...s.secciones.flatMap((x) => [x.h2, ...x.parrafos]),
    ...s.incluye,
    ...s.faq.flatMap((f) => [f.q, f.a]),
  ].join(' ');

const perdonado = (a, b) =>
  PERDONADOS.some((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));

const fallos = [];
const avisos = [];

for (const lang of IDIOMAS) {
  const servicios = JSON.parse(readFileSync(`./src/data/servicios.${lang}.json`, 'utf8'));
  const dict = JSON.parse(readFileSync(`./src/i18n/${lang}.json`, 'utf8'));

  // 1. Campos que tienen que ser únicos dentro del idioma
  for (const campo of ['metaTitle', 'metaDescription', 'h1', 'titulo', 'slug', 'resumen']) {
    const vistos = new Map();
    for (const s of servicios) {
      const v = norm(String(s[campo] ?? ''));
      if (vistos.has(v)) {
        fallos.push(`[${lang}] «${campo}» repetido entre "${vistos.get(v)}" y "${s.slug}"`);
      }
      vistos.set(v, s.slug);
    }
  }

  // 2. Ningún servicio puede repetir las metas de la portada ni del índice
  const contraPortada = [
    ['la portada', dict.meta.title, dict.meta.description],
    ['el índice /servicios', dict.serviciosPage.metaTitle, dict.serviciosPage.metaDescription],
  ];
  for (const s of servicios) {
    for (const [donde, title, desc] of contraPortada) {
      if (norm(s.metaTitle) === norm(title)) {
        fallos.push(`[${lang}] "${s.slug}" tiene el mismo <title> que ${donde}`);
      }
      if (norm(s.metaDescription) === norm(desc)) {
        fallos.push(`[${lang}] "${s.slug}" tiene la misma description que ${donde}`);
      }
    }
  }

  // 3. Similitud de cuerpo entre cada par
  const cuerpos = servicios.map((s) => ({ slug: s.slug, sh: shingles(cuerpoDe(s)) }));
  for (let i = 0; i < cuerpos.length; i++) {
    for (let j = i + 1; j < cuerpos.length; j++) {
      const sim = jaccard(cuerpos[i].sh, cuerpos[j].sh);
      if (sim >= UMBRAL_SIMILITUD && !perdonado(cuerpos[i].slug, cuerpos[j].slug)) {
        fallos.push(
          `[${lang}] "${cuerpos[i].slug}" y "${cuerpos[j].slug}" se parecen demasiado ` +
          `(${(sim * 100).toFixed(0)} % de frases comunes, el límite es ${(UMBRAL_SIMILITUD * 100).toFixed(0)} %)`,
        );
      } else if (sim >= UMBRAL_SIMILITUD * 0.75) {
        avisos.push(`[${lang}] "${cuerpos[i].slug}" y "${cuerpos[j].slug}" al ${(sim * 100).toFixed(0)} %, vigilar`);
      }
    }
  }

  // 4. Contenido delgado
  for (const s of servicios) {
    const palabras = norm(cuerpoDe(s)).split(' ').filter(Boolean).length;
    if (palabras < MINIMO_PALABRAS) {
      fallos.push(`[${lang}] "${s.slug}" tiene ${palabras} palabras, el mínimo es ${MINIMO_PALABRAS}`);
    }
    if (s.faq.length < 3) {
      fallos.push(`[${lang}] "${s.slug}" tiene ${s.faq.length} preguntas, hacen falta 3`);
    }
  }
}

// 5. Los dos catálogos tienen que llevar los mismos slugs y en el mismo orden:
//    si divergen, el hreflang de una ficha apunta a una página que no existe.
const slugs = IDIOMAS.map((l) =>
  JSON.parse(readFileSync(`./src/data/servicios.${l}.json`, 'utf8')).map((s) => s.slug),
);
if (slugs[0].join('|') !== slugs[1].join('|')) {
  fallos.push('Los slugs de servicios.es.json y servicios.en.json no coinciden. El hreflang apuntaría a un 404.');
}

for (const a of avisos) console.warn(`  aviso  ${a}`);

if (fallos.length) {
  console.error(`\n✖ verificar-servicios: ${fallos.length} problema(s)\n`);
  for (const f of fallos) console.error(`  ${f}`);
  console.error('\nDos páginas que dicen lo mismo compiten entre sí y Google descarta una.');
  console.error('Reescribe la que sobre, no subas el umbral.\n');
  process.exit(1);
}

console.log(`✓ verificar-servicios: ${slugs[0].length} servicios × ${IDIOMAS.length} idiomas, sin solapes`);
