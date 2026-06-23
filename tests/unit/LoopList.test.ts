import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import LoopList from '../../src/lib/components/LoopList.svelte';
import { createTranslator } from '../../src/lib/i18n/index.js';
import type { Segment } from '../../src/lib/ports/StoragePort.js';

afterEach(() => cleanup());

const t = createTranslator('en');

const loops: Segment[] = [
	{
		id: 'loop-1',
		videoId: 'abc123',
		name: 'Chorus',
		pointA: 10,
		pointB: 30,
		speed: 0.75,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}
];

describe('LoopList.svelte', () => {
	it('shows the loop name', () => {
		render(LoopList, { loops, t, onLoad: vi.fn(), onDelete: vi.fn() });
		expect(screen.getByText(/Chorus/)).toBeTruthy();
	});

	it('shows formatted pointA time', () => {
		// formatTimecode(10, 30) = '00:10:00'
		render(LoopList, { loops, t, onLoad: vi.fn(), onDelete: vi.fn() });
		expect(screen.getByText(/00:10:00/)).toBeTruthy();
	});

	it('shows formatted pointB time', () => {
		// formatTimecode(30, 30) = '00:30:00'
		render(LoopList, { loops, t, onLoad: vi.fn(), onDelete: vi.fn() });
		expect(screen.getByText(/00:30:00/)).toBeTruthy();
	});

	it('shows the playback speed', () => {
		render(LoopList, { loops, t, onLoad: vi.fn(), onDelete: vi.fn() });
		expect(screen.getByText(/0\.75/)).toBeTruthy();
	});
});
