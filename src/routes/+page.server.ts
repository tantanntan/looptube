import type { PageServerLoad } from './$types';
import { parseLocale } from '$lib/i18n/index.js';

export const load: PageServerLoad = ({ request }) => {
	const locale = parseLocale(request.headers.get('accept-language') ?? '');
	return { locale };
};
