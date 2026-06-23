const VALID_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export type ParseResult =
	| { ok: false; errors: string[] }
	| { ok: true; videoId: string; pointA: number; pointB: number; speed: number; warnings: string[] };

export type ClampResult = {
	pointA: number;
	pointB: number;
	clamped: boolean;
	message?: string;
};

export interface EncodeInput {
	videoId: string;
	pointA: number;
	pointB: number;
	speed: number;
}

export const UrlSerializer = {
	parse(urlOrParams: string): ParseResult {
		let params: URLSearchParams;
		try {
			const u = new URL(urlOrParams);
			params = u.searchParams;
		} catch {
			params = new URLSearchParams(urlOrParams);
		}

		const errors: string[] = [];
		const warnings: string[] = [];

		const videoId = params.get('v');
		if (!videoId) errors.push('Missing video ID (v parameter)');

		const aRaw = params.get('a');
		const bRaw = params.get('b');
		const sRaw = params.get('s');

		if (aRaw === null) errors.push('Missing pointA (a parameter)');
		if (bRaw === null) errors.push('Missing pointB (b parameter)');

		if (errors.length > 0) return { ok: false, errors };

		const pointA = parseFloat(aRaw!);
		const pointB = parseFloat(bRaw!);

		if (isNaN(pointA) || pointA < 0) {
			errors.push('pointA must be a non-negative number');
		}
		if (isNaN(pointB)) {
			errors.push('pointB must be a number');
		}
		if (!isNaN(pointA) && !isNaN(pointB) && pointA >= pointB) {
			errors.push('pointA must be less than pointB');
		}

		if (errors.length > 0) return { ok: false, errors };

		let speed = 1.0;
		if (sRaw !== null) {
			const parsed = parseFloat(sRaw);
			if (!isNaN(parsed) && VALID_SPEEDS.includes(parsed)) {
				speed = parsed;
			} else {
				warnings.push(`Unrecognized speed "${sRaw}"; defaulting to 1.0×`);
			}
		}

		return { ok: true, videoId: videoId!, pointA, pointB, speed, warnings };
	},

	encode(input: EncodeInput): string {
		const p = new URLSearchParams();
		p.set('v', input.videoId);
		p.set('a', input.pointA.toFixed(1));
		p.set('b', input.pointB.toFixed(1));
		p.set('s', String(input.speed));
		return p.toString();
	},

	clampToDuration(
		parsed: ParseResult & { ok: true },
		duration: number
	): ClampResult {
		let { pointA, pointB } = parsed;
		let clamped = false;

		if (pointB > duration) {
			pointB = duration;
			clamped = true;
		}
		if (pointA >= pointB) {
			pointA = Math.max(0, pointB - 1);
			clamped = true;
		}

		return {
			pointA,
			pointB,
			clamped,
			message: clamped ? 'share.loop_clamped' : undefined
		};
	}
};
