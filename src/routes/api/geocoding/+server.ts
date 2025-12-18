import { GOOGLE_API } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const address = url.searchParams.get('latlng');
	if (!address) {
		return new Response('Missing address parameter', { status: 400 });
	}

	const response = await fetch(
		`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
			address
		)}&key=${GOOGLE_API}`
	);
	const data = await response.json();
	console.log(data);

	if (data.status === 'OK') {
		const location = data.results[0].formatted_address;
		return new Response(JSON.stringify(location), { status: 200 });
	} else {
		return new Response('Geocoding failed', { status: 500 });
	}
};
