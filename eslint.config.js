import boundaries from 'eslint-plugin-boundaries';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
	{
		ignores: [
			'node_modules/**',
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'coverage/**'
		]
	},
	...tsEslint.configs.recommended,
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		plugins: { boundaries },
		settings: {
			'boundaries/elements': [
				{ type: 'core', pattern: 'src/lib/core/*' },
				{ type: 'ports', pattern: 'src/lib/ports/*' },
				{ type: 'adapters', pattern: 'src/lib/adapters/*' },
				{ type: 'fakes', pattern: 'src/lib/fakes/*' },
				{ type: 'services', pattern: 'src/lib/services/*' },
				{ type: 'components', pattern: 'src/lib/components/*' },
				{ type: 'routes', pattern: 'src/routes/*' }
			]
		},
		rules: {
			'boundaries/element-types': [
				'error',
				{
					default: 'allow',
					rules: [
						{
							from: 'core',
							disallow: ['adapters', 'components', 'routes', 'services', 'fakes']
						},
						{
							from: 'ports',
							disallow: ['adapters', 'components', 'routes', 'services', 'fakes']
						}
					]
				}
			]
		}
	},
	// T005: src/lib/core/** must have zero DOM/framework dependencies
	{
		files: ['src/lib/core/**/*.ts'],
		rules: {
			'no-restricted-globals': [
				'error',
				'window',
				'document',
				'localStorage',
				'sessionStorage',
				'globalThis',
				'location',
				'history',
				'navigator',
				'fetch'
			],
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['$app/*'],
							message: 'Do not import $app/* in core modules — use RouterPort'
						},
						{
							group: ['svelte', 'svelte/*'],
							message: 'Do not import svelte in core modules'
						},
						{
							group: ['@sveltejs/*'],
							message: 'Do not import @sveltejs/* in core modules'
						}
					]
				}
			]
		}
	}
);
