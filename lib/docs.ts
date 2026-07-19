import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

export type DocLang = 'en' | 'ko';

export const GROUPS = ['Getting started', 'Core', 'Workflows', 'Operating', 'Reference'] as const;
export type DocGroup = (typeof GROUPS)[number];

export type DocMeta = {
  slug: string;
  title: string;
  group: DocGroup;
  description: string;
  order: number;
};
export type DocNavGroup = { group: DocGroup; items: DocMeta[] };
export type DocArticle = DocMeta & { html: string; prev: DocMeta | null; next: DocMeta | null };

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

export function listDocFiles(lang: DocLang): string[] {
  return fs
    .readdirSync(path.join(CONTENT_ROOT, lang))
    .filter((f) => f.endsWith('.md'))
    .sort();
}

/** en/ko 파일 세트가 다르면 빌드를 실패시킨다 (번역 누락 방지). */
export function assertLangParity(): void {
  const en = listDocFiles('en');
  const ko = listDocFiles('ko');
  if (en.join(',') !== ko.join(',')) {
    throw new Error(
      `docs content mismatch between en and ko:\n  en: [${en.join(', ')}]\n  ko: [${ko.join(', ')}]`,
    );
  }
}

function parseFile(lang: DocLang, file: string): { meta: DocMeta; content: string } {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, lang, file), 'utf8');
  const { data, content } = matter(raw);
  const title = data.title as unknown;
  const slug = data.slug as unknown;
  const group = data.group as unknown;
  const description = data.description as unknown;
  if (!title || !slug || !group || !description) {
    throw new Error(`${lang}/${file}: frontmatter must include title, slug, group, description`);
  }
  if (!/^[a-z0-9-]+$/.test(String(slug))) {
    throw new Error(`${lang}/${file}: slug "${slug}" must match [a-z0-9-]+`);
  }
  if (!(GROUPS as readonly string[]).includes(String(group))) {
    throw new Error(`${lang}/${file}: group "${group}" must be one of ${GROUPS.join(', ')}`);
  }
  const m = file.match(/^(\d+)-/);
  const order = m ? parseInt(m[1], 10) : 999;
  return {
    meta: {
      slug: String(slug),
      title: String(title),
      group: String(group) as DocGroup,
      description: String(description),
      order,
    },
    content,
  };
}

/** 언어별 전체 문서 메타(파일명 NN 순서). */
export function readAllMeta(lang: DocLang): DocMeta[] {
  assertLangParity();
  const metas = listDocFiles(lang).map((f) => parseFile(lang, f).meta);
  const seen = new Set<string>();
  for (const m of metas) {
    if (seen.has(m.slug)) {
      throw new Error(`${lang}: duplicate slug "${m.slug}" in content/docs`);
    }
    seen.add(m.slug);
  }
  return metas.sort((a, b) => a.order - b.order);
}

export function listSlugs(lang: DocLang): string[] {
  return readAllMeta(lang).map((m) => m.slug);
}

/** 사이드바용: GROUPS 순서로 묶인 그룹별 문서 목록. */
export function getDocsNav(lang: DocLang): DocNavGroup[] {
  const metas = readAllMeta(lang);
  return GROUPS.map((group) => ({ group, items: metas.filter((m) => m.group === group) })).filter(
    (g) => g.items.length > 0,
  );
}

async function renderMarkdown(content: string): Promise<string> {
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeHighlight, { detect: false, ignoreMissing: true })
      .use(rehypeStringify)
      .process(content),
  );
}

/** 단일 article: 렌더된 html + 선형 순서상의 prev/next. */
export async function loadDoc(lang: DocLang, slug: string): Promise<DocArticle> {
  const metas = readAllMeta(lang);
  const idx = metas.findIndex((m) => m.slug === slug);
  if (idx === -1) {
    throw new Error(`${lang}: no doc with slug "${slug}"`);
  }
  let content = '';
  for (const f of listDocFiles(lang)) {
    const parsed = parseFile(lang, f);
    if (parsed.meta.slug === slug) {
      content = parsed.content;
      break;
    }
  }
  const html = await renderMarkdown(content);
  return {
    ...metas[idx],
    html,
    prev: idx > 0 ? metas[idx - 1] : null,
    next: idx < metas.length - 1 ? metas[idx + 1] : null,
  };
}
