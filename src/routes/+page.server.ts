import type { PageServerLoad } from './$types';
import { parseLocale } from '$lib/i18n/index.js';

export const load: PageServerLoad = ({ request }) => {
	const raw = request.headers.get('accept-language') ?? '';
	const locale = parseLocale(raw);
	return { locale };
};
