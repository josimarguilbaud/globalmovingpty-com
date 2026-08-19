import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Los artículos del blog.
 *
 * Viven en `src/content/blog/{lang}/{slug}.md`, así que el id de cada entrada
 * queda `lang/slug`. Es el mismo esquema que usan las webs de San Blas y evita
 * tener una colección por idioma.
 *
 * `servicio` ata el artículo a la ficha con la que se relaciona. No es
 * decorativo: es el enlace interno que convierte una visita informativa
 * («¿qué no puedo llevarme?») en una visita comercial. Un blog que no enlaza
 * a lo que vendes es un gasto.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    minutes: z.number().default(6),
    date: z.coerce.date(),
    // Slug de la ficha de servicio relacionada. Se valida contra el catálogo
    // en `verificar-blog.mjs`: un slug que no existe rompe el build en vez de
    // publicar un enlace muerto.
    servicio: z.string(),
  }),
});

export const collections = { blog };
