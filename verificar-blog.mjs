/**
 * Guardián del blog. Corre en el `prebuild`, junto al de servicios.
 *
 * Un blog es la parte de la web que más manos toca y donde el contenido se
 * copia con más facilidad: dos artículos sobre mudanzas acaban diciendo lo
 * mismo sin que nadie lo decida. Esto lo detecta antes de publicarlo.
 *
 * Comprueba cinco cosas:
 *
 *   1. Que el `servicio` de cada artículo existe en el catálogo. Si no, el
 *      enlace del pie del artículo estaría muerto — y como se pinta desde los
 *      datos, saldría publicado sin que nadie lo viera.
 *   2. Que ningún artículo repite título o descripción de otro.
 *   3. Que ningún artículo choca con el `<title>` de una ficha de servicio.
 *      Esto importa más de lo que parece: el artículo sobre mascotas y la
 *      ficha de mascotas compiten por la misma consulta si dicen lo mismo, y
 *      la que pierde es la ficha, que es la que vende.
 *   4. Similitud de cuerpo entre artículos, igual que en los servicios.
 *   5. Que los dos idiomas tengan los mismos slugs. Si no, el hreflang de un
 *      artículo apuntaría a un 404.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const IDIOMAS = ['es', 'en'];
const UMBRAL_SIMILITUD = 0.20;
const MINIMO_PALABRAS = 450;

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

/** Frontmatter simple: sin dependencias, el formato lo controlamos nosotros. */
const leer = (ruta) => {
  const bruto = readFileSync(ruta, 'utf8');
  const m = bruto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`${ruta}: no tiene frontmatter`);
  const meta = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const kv = linea.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1').trim();
  }
  return { meta, cuerpo: m[2] };
};

const fallos = [];
const slugsPorIdioma = {};

for (const lang of IDIOMAS) {
  const dir = `./src/content/blog/${lang}`;
  if (!existsSync(dir)) { slugsPorIdioma[lang] = []; continue; }

  const ficheros = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  slugsPorIdioma[lang] = ficheros.map((f) => f.replace(/\.md$/, ''));

  const servicios = JSON.parse(readFileSync(`./src/data/servicios.${lang}.json`, 'utf8'));
  const slugsServicio = new Set(servicios.map((s) => s.slug));
  const titulosServicio = new Map(servicios.map((s) => [norm(s.metaTitle), s.slug]));

  const posts = ficheros.map((f) => ({ f, ...leer(`${dir}/${f}`) }));

  // 1. El servicio referenciado tiene que existir
  for (const p of posts) {
    if (!p.meta.servicio) fallos.push(`[${lang}] ${p.f}: no declara "servicio"`);
    else if (!slugsServicio.has(p.meta.servicio)) {
      fallos.push(`[${lang}] ${p.f}: apunta al servicio "${p.meta.servicio}", que no existe en el catálogo`);
    }
  }

  // 2. Título y descripción únicos entre artículos
  for (const campo of ['title', 'description']) {
    const vistos = new Map();
    for (const p of posts) {
      const v = norm(String(p.meta[campo] ?? ''));
      if (vistos.has(v)) fallos.push(`[${lang}] "${campo}" repetido entre ${vistos.get(v)} y ${p.f}`);
      vistos.set(v, p.f);
    }
  }

  // 3. Ningún artículo choca con el title de una ficha de servicio
  for (const p of posts) {
    const choque = titulosServicio.get(norm(p.meta.title ?? ''));
    if (choque) fallos.push(`[${lang}] ${p.f} tiene el mismo título que la ficha "${choque}"`);
  }

  // 4. Similitud de cuerpo y contenido delgado
  const cuerpos = posts.map((p) => ({ f: p.f, sh: shingles(p.cuerpo) }));
  for (let i = 0; i < cuerpos.length; i++) {
    for (let j = i + 1; j < cuerpos.length; j++) {
      const sim = jaccard(cuerpos[i].sh, cuerpos[j].sh);
      if (sim >= UMBRAL_SIMILITUD) {
        fallos.push(
          `[${lang}] ${cuerpos[i].f} y ${cuerpos[j].f} se parecen demasiado ` +
          `(${(sim * 100).toFixed(0)} %, el límite es ${(UMBRAL_SIMILITUD * 100).toFixed(0)} %)`,
        );
      }
    }
  }
  for (const p of posts) {
    const palabras = norm(p.cuerpo).split(' ').filter(Boolean).length;
    if (palabras < MINIMO_PALABRAS) {
      fallos.push(`[${lang}] ${p.f}: ${palabras} palabras, el mínimo es ${MINIMO_PALABRAS}`);
    }
  }
}

// 5. Mismos slugs en los dos idiomas
if (slugsPorIdioma.es.join('|') !== slugsPorIdioma.en.join('|')) {
  const soloEs = slugsPorIdioma.es.filter((s) => !slugsPorIdioma.en.includes(s));
  const soloEn = slugsPorIdioma.en.filter((s) => !slugsPorIdioma.es.includes(s));
  fallos.push(
    'Los slugs del blog no coinciden entre idiomas, el hreflang apuntaría a un 404. ' +
    `Solo en es: [${soloEs.join(', ') || 'ninguno'}]. Solo en en: [${soloEn.join(', ') || 'ninguno'}].`,
  );
}

if (fallos.length) {
  console.error(`\n✖ verificar-blog: ${fallos.length} problema(s)\n`);
  for (const f of fallos) console.error(`  ${f}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ verificar-blog: ${slugsPorIdioma.es.length} artículos × ${IDIOMAS.length} idiomas, sin solapes`);
