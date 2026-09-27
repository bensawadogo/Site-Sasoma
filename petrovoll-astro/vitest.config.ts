// Tests unitaires (fonctions pures) : même alias `@/` → `src/` que tsconfig.json.
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
