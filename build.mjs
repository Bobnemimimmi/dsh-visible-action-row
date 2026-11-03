/**
 * Build both halves of the dsh-visible-action-row package with esbuild.
 *
 * - `lib/index.js`  — the node half (ESM): a no-op Cordis plugin the host
 *   Loader imports for the bundle's patch row.
 * - `lib/client.js` — the browser half: a classic script registering the
 *   lazy factory with `window.__ModuleLoader__`, wrapped in the same
 *   banner/footer handoff shape as DSH's own client bundles (see
 *   `packages/client/tsdown.client.ts` in the DSH checkout). The stylesheet
 *   is inlined as a text constant, so no CSS pipeline is needed.
 *
 * The built artifacts are committed, so path/tarball installs need no build
 * step; `prepare` re-runs this build after a git install.
 *
 * The stylesheet is normalized to LF before it is inlined: the artifact must
 * not depend on the checkout's line endings (`core.autocrlf`), or a Windows
 * build and a Linux build would publish different bytes.
 */
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const PACKAGE_ID = 'dsh-visible-action-row'

/** Inline `.css` as an LF-normalized string so the bundle is byte-stable. */
const normalizedCssText = {
  name: 'normalized-css-text',
  setup(esbuild) {
    esbuild.onLoad({ filter: /\.css$/ }, async (args) => {
      const text = await readFile(args.path, 'utf8')
      return {
        contents: `export default ${JSON.stringify(text.replace(/\r\n?/g, '\n'))}`,
        loader: 'js',
      }
    })
  },
}

const clientBanner = [
  `window.__ModuleLoader__.load({`,
  `  id: ${JSON.stringify(PACKAGE_ID)},`,
  `  factory: (require) => {`,
  `    var module = { exports: {} };`,
  `    var exports = module.exports;`,
].join('\n')

const clientFooter = [
  `    return module.exports;`,
  `  },`,
  `});`,
].join('\n')

await Promise.all([
  build({
    entryPoints: ['src/index.ts'],
    outfile: 'lib/index.js',
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    logLevel: 'info',
  }),
  build({
    entryPoints: ['src/client/index.ts'],
    outfile: 'lib/client.js',
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2018',
    plugins: [normalizedCssText],
    banner: { js: clientBanner },
    footer: { js: clientFooter },
    // `lib/client.js` is a browser classic script, never a Node module:
    // silence the advisory CJS-in-ESM warning the package.json "type" trips.
    logOverride: { 'commonjs-variable-in-esm': 'silent' },
    logLevel: 'info',
  }),
])
