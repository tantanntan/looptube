import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import SegmentList from '../../src/lib/components/SegmentList.svelte';
import type { Segment } from '../../src/lib/ports/StoragePort.js';

afterEach(() => cleanup());

const seg1: Segment = {
	id: 'id1',
	videoId: 'vid1',
	name: 'verse',
	pointA: 10,
	pointB: 30,
	speed: 1.0,
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01')
};

const seg2: Segment = {
	id: 'id2',
	videoId: 'vid1',
	name: 'chorus',
	pointA: 40,
	pointB: 80,
	speed: 1.25,
	createdAt: new Date('2024-01-02'),
	updatedAt: new Date('2024-01-02')
};

describe('SegmentList.svelte', () => {
	it('renders empty state when no segments', () => {
		render(SegmentList, { segments: [] });
		expect(screen.getByText(/no saved segments/i)).toBeTruthy();
	});

	it('renders segment names', () => {
		render(SegmentList, { segments: [seg1, seg2] });
		expect(screen.getByText('verse')).toBeTruthy();
		expect(screen.getByText('chorus')).toBeTruthy();
	});

	it('calls onLoad when Load button is clicked', async () => {
		const onLoad = vi.fn();
		render(SegmentList, { segments: [seg1], onLoad });
		const buttons = screen.getAllByRole('button', { name: /load/i });
		await fireEvent.click(buttons[0]);
		expect(onLoad).toHaveBeenCalledWith(seg1);
	});

	it('calls onDelete when Delete button is clicked', async () => {
		const onDelete = vi.fn();
		render(SegmentList, { segments: [seg1], onDelete });
		const buttons = screen.getAllByRole('button', { name: /delete/i });
		await fireEvent.click(buttons[0]);
		expect(onDelete).toHaveBeenCalledWith('id1');
	});

	it('renders A/B times for each segment', () => {
		render(SegmentList, { segments: [seg1] });
		expect(screen.getByText(/10/)).toBeTruthy();
		expect(screen.getByText(/30/)).toBeTruthy();
	});
});
