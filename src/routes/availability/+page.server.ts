import type { PageServerLoad } from './$types';
import { getTravelTime } from '$lib/routing';

export const load = (async ({ fetch }) => {
	// const cal = await (await fetch('/api/availability')).json();
	// const time = (await getTravelTime('20 Ayr Street, Doncaster', "Scots' Church, Melbourne"))
	// 	.rescale()
	// 	.toHuman();
	// return {
	// 	//appointments: appointments,
	// 	calendar: JSON.stringify(cal.availability),
	// 	time
	// };
}) satisfies PageServerLoad;
