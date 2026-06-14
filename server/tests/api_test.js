const http = require('http');

function request(path, method='GET', body, token) {
  const options = { hostname: 'localhost', port: 4000, path, method, headers: {} };
  if (token) options.headers.Authorization = `Bearer ${token}`;
  if (body) { options.headers['Content-Type'] = 'application/json'; }
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data=''; res.on('data', c=>data+=c); res.on('end', ()=>{ try{ resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e){ resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Running API smoke tests...');
  try {
    const auth = await request('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
    if (auth.status !== 200 || !auth.body.token) throw new Error('Login failed');
    const token = auth.body.token;

    let r = await request('/api/vehicles', 'GET', null, token);
    console.log('/api/vehicles', r.status);

    r = await request('/api/drivers', 'GET', null, token);
    console.log('/api/drivers', r.status);

    // create then update a driver
    const newDriver = { name: 'Test Driver', licence: 'TD-001', monthly_salary: 10000 };
    r = await request('/api/drivers', 'POST', newDriver, token);
    console.log('create driver', r.status, r.body);
    const driverId = r.body.id;

    r = await request(`/api/drivers/${driverId}`, 'PUT', { name: 'Updated', licence: 'TD-001', monthly_salary: 12000 }, token);
    console.log('update driver', r.status, r.body);

    console.log('API smoke tests completed');
  } catch (err) { console.error('Tests failed', err); process.exit(1); }
}

run();
