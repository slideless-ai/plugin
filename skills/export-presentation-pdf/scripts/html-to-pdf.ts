#!/usr/bin/env -S npx tsx
import { resolve, dirname, basename, extname, isAbsolute } from 'node:path';
import { access, stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer, { type PaperFormat } from 'puppeteer';

type Style = 'full-deck' | 'slim-tabbed' | 'unknown' | 'none';

type Args = {
  in: string;
  out?: string;
  inject?: string;
  style: Style | 'auto';
  format: PaperFormat;
  landscape: boolean;
  timeoutMs: number;
  scale?: number;
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PRINT_CSS_DIR = resolve(SCRIPT_DIR, '..', 'print-css');

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    if (i === -1) return undefined;
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) return '';
    return v;
  };
  const has = (flag: string) => argv.includes(flag);

  const inPath = get('--in');
  if (!inPath) fail('missing --in <html_path>');

  const style = (get('--style') || 'auto') as Args['style'];
  if (!['auto', 'full-deck', 'slim-tabbed', 'none'].includes(style)) {
    fail(`invalid --style: ${style}`);
  }

  const format = (get('--format') || 'A4') as PaperFormat;
  const scaleRaw = get('--scale');
  const timeoutRaw = get('--timeout-ms');

  return {
    in: resolveAbs(inPath!),
    out: get('--out') ? resolveAbs(get('--out')!) : undefined,
    inject: get('--inject') ? resolveAbs(get('--inject')!) : undefined,
    style,
    format,
    landscape: has('--landscape'),
    timeoutMs: timeoutRaw ? Number(timeoutRaw) : 60_000,
    scale: scaleRaw ? Number(scaleRaw) : undefined,
  };
}

function resolveAbs(p: string): string {
  return isAbsolute(p) ? p : resolve(process.cwd(), p);
}

function fail(msg: string, extra?: unknown): never {
  process.stderr.write(JSON.stringify({ ok: false, error: msg, extra }) + '\n');
  process.exit(1);
}

function ok(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify({ ok: true, ...payload }) + '\n');
}

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

/**
 * Detect the Slideless style from the raw HTML. Uses word-boundary regexes so
 * `class="slide slide--black active"` still matches `full-deck`, and
 * `data-tab="0"` matches `slim-tabbed`.
 */
function detectStyle(html: string): Style {
  const SLIDE_RE = /class\s*=\s*["'][^"']*\bslide\b[^"']*["']/;
  const TAB_RE = /\bdata-tab\s*=\s*["']/;
  if (SLIDE_RE.test(html)) return 'full-deck';
  if (TAB_RE.test(html)) return 'slim-tabbed';
  return 'unknown';
}

function cssPathFor(style: Style): string | null {
  if (style === 'full-deck') return resolve(PRINT_CSS_DIR, 'full-deck.css');
  if (style === 'slim-tabbed') return resolve(PRINT_CSS_DIR, 'slim-tabbed.css');
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await exists(args.in))) fail(`input not found: ${args.in}`);

  const outPath = args.out ?? defaultOut(args.in);

  // Always detect the style (also needed for the print-prep step below),
  // then decide which CSS (if any) to inject.
  // Precedence: explicit --inject > explicit --style > auto-detect.
  const html = await readFile(args.in, 'utf8');
  let detected: Style = detectStyle(html);
  let cssToInject: string | null = null;

  if (args.inject) {
    if (!(await exists(args.inject))) fail(`inject css not found: ${args.inject}`);
    cssToInject = args.inject;
  } else if (args.style === 'none') {
    cssToInject = null;
  } else if (args.style === 'auto') {
    cssToInject = cssPathFor(detected);
  } else {
    detected = args.style as Style;
    cssToInject = cssPathFor(detected);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(args.timeoutMs);

    const fileUrl = 'file://' + args.in;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: args.timeoutMs });

    if (cssToInject) {
      const css = await readFile(cssToInject, 'utf8');
      await page.addStyleTag({ content: css });
    }

    // Print-prep: finalize JS-driven states that CSS alone can't reach.
    // full-deck decks reveal fragments on keypress and animate counters only
    // when a slide becomes .active — in print, every slide must show its end
    // state. Mirrors the style's own animateCounters() formatting.
    let prepped = false;
    if (detected === 'full-deck' && args.style !== 'none') {
      prepped = await page.evaluate(() => {
        let touched = 0;
        document.querySelectorAll('.fragment').forEach((f) => {
          f.classList.add('fragment--shown');
          touched++;
        });
        document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
          const target = parseInt(el.dataset.count || '', 10);
          if (Number.isNaN(target)) return;
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const v = el.dataset.format === 'comma' ? target.toLocaleString() : String(target);
          el.textContent = prefix + v + suffix;
          touched++;
        });
        document.querySelectorAll<HTMLElement>('[data-text]').forEach((el) => {
          if (el.dataset.text) {
            el.textContent = el.dataset.text;
            touched++;
          }
        });
        return touched > 0;
      });
    }

    await page.emulateMediaType('print');
    // Give layout/fonts a beat to settle after CSS injection.
    await new Promise((r) => setTimeout(r, 250));

    await page.pdf({
      path: outPath,
      format: args.format,
      landscape: args.landscape,
      printBackground: true,
      preferCSSPageSize: true,
      scale: args.scale,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const s = await stat(outPath);
    ok({
      out: outPath,
      bytes: s.size,
      format: args.format,
      landscape: args.landscape,
      style: args.inject ? 'custom' : detected,
      injected: cssToInject,
      prepped,
    });
  } catch (err) {
    fail('render failed', String((err as Error)?.stack ?? err));
  } finally {
    await browser.close();
  }
}

function defaultOut(inPath: string): string {
  const dir = dirname(inPath);
  const base = basename(inPath, extname(inPath));
  return resolve(dir, base + '.pdf');
}

main().catch((err) => fail('unhandled', String(err)));
