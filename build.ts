/**
 * Compila src/index.ts para dist/server.js.
 *
 * Porquê um ficheiro próprio e não um one-liner no package.json: o banner/footer
 * abaixo não é cosmético e não pode ser removido.
 *
 * O runtime JS do FXServer avalia `citizen/scripting/v8/natives_server.js` e o
 * script do recurso no MESMO escopo. Esse ficheiro declara, no topo,
 * `const _i, _f, _v, _r, _ri, _rf, _rl, _s, _rv, _ro, _in, _ii, _fi`. Qualquer
 * declaração nossa de topo com um desses nomes rebenta o carregamento inteiro com
 * `SyntaxError: Identifier '_s' has already been declared` — e o minificador do
 * bun gera exatamente nomes curtos deste feitio.
 *
 * O IIFE resolve a classe toda do problema: o bundle deixa de declarar seja o que
 * for no escopo partilhado. O `index.ts` só usa globais (GetConvar, on, exports) e
 * não exporta nada, por isso não perde nada por estar fechado.
 */
import { buildOut } from '../../tools/build/paths'

const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  // Árvore única, já no sítio onde o fxmanifest o procura (`server_script 'dist/server.js'`).
  outdir: buildOut('tc_db'),
  naming: 'server.js',
  target: 'node',
  format: 'cjs',
  minify: true,
  banner: '(() => {',
  footer: '})();',
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

export {}