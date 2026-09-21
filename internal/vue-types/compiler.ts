import * as compiler from 'vue/compiler-sfc'
import ts from '@typescript/typescript6'

// Vue's imported props/emits resolver still uses the JavaScript compiler API.
// Keep it on the official TS6 compatibility package while tsc runs native TS7.
// compiler-sfc's declaration resolves the root TS7 package, although this
// runtime hook needs the pre-7 API. Describe that boundary explicitly.
const registerTS = compiler.registerTS as unknown as (
  loadTS: () => typeof ts
) => void
registerTS(() => ts)

export { compiler }
