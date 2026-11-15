// Cloudflare Pages Function: GET /api/where
// Returns the visitor's approximate city and country, which Cloudflare already
// works out from the IP address of every request. Nothing is logged or stored.
export function onRequestGet({ request }) {
  const cf = request.cf || {};
  return new Response(JSON.stringify({ city: cf.city || null, country: cf.country || null }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
