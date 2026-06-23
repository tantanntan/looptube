import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	// configFile: false prevents loading svelte.config.js's vitePreprocess(),
	// which avoids the Vite 6 PartialEnvironment("client") crash in jsdom
	// when preprocessing <style> blocks. TypeScript is handled by Vite/esbuild.
	plugins: [svelte({ hot: false, configFile: false })],
	resolve: {
		conditions: ['browser'],
		alias: {
			$lib: resolve(__dirname, 'src/lib'),
			$app: resolve(__dirname, 'node_modules/@sveltejs/kit/src/runtime/app')
		}
	},
	test: {
		include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
		exclude: ['tests/e2e/**'],
		environment: 'jsdom',
		setupFiles: [resolve(__dirname, 'tests/setup.ts')],
		coverage: {
			provider: 'v8',
			include: ['src/lib/core/**'],
			thresholds: {
				branches: 100,
				functions: 100,
				lines: 100,
				statements: 100
			}
		}
	}
});
