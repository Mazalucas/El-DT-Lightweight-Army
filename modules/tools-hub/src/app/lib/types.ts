export type CatalogSection = 'tool' | 'command' | 'system';

export type CatalogEntry = {
  id: string;
  label: string;
  kind: 'module' | 'command';
  section: CatalogSection;
  category: string;
  status: string;
  tags: string[];
  aliases: string[];
  /** Texto corto para humanos */
  summary: string;
  description: string;
  icon: string;
  action?: {
    type: 'command' | 'url' | 'path';
    value: string;
    hint?: string;
  };
  /** Solo herramientas con dev server local — el API /api/launch resuelve el script. */
  launch?: {
    url: string;
    port: number;
  };
  searchText: string;
};

export type Catalog = {
  generatedAt: string;
  entries: CatalogEntry[];
};

export const SECTION_META: Record<
  CatalogSection,
  { title: string; subtitle: string; empty: string }
> = {
  tool: {
    title: 'Herramientas',
    subtitle: 'Apps que abrís y usás — facturas, calculadoras, etc.',
    empty: 'Todavía no hay herramientas registradas.',
  },
  command: {
    title: 'Comandos de Cursor',
    subtitle: 'Atajos que escribís en el chat — copiá y pegá en Cursor.',
    empty: 'No hay comandos en el catálogo.',
  },
  system: {
    title: 'Sistema del repo',
    subtitle: 'Infraestructura del segundo cerebro — no son apps de uso diario.',
    empty: 'Nada en esta sección.',
  },
};
