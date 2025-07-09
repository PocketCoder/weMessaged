import { expect, it } from 'vitest';
import { convertAppleDateInt } from './utils';

it('converts Apple Date to standard ISO 8601 formatted date string', () => {
	expect(convertAppleDateInt(523042290000000000)).toBe(
		'2017-07-29T17:31:30.000Z'
	);
});
