const baseUrl = (process.env.GARAGE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

const vehiclesResponse = await fetch(`${baseUrl}/vehicles`);
if (!vehiclesResponse.ok) throw new Error(`GET /vehicles: HTTP ${vehiclesResponse.status}`);
const vehicles = await vehiclesResponse.json();
let failed = false;
for (const vehicle of vehicles) {
  for (const resource of ['maintenance', 'maintenance-schedule']) {
    const path = `/vehicles/${vehicle.id}/${resource}`;
    const response = await fetch(`${baseUrl}${path}`);
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();
    let json = false;
    try { JSON.parse(text); json = true; } catch { /* Report below without hiding the response shape. */ }
    const result = { vehicle: `${vehicle.brand} ${vehicle.model}`, resource, status: response.status, contentType, json, bytes: Buffer.byteLength(text), preview: json ? undefined : text.slice(0, 120) };
    console.log(JSON.stringify(result));
    if (!response.ok || !json) failed = true;
  }
}
if (failed) process.exitCode = 1;
