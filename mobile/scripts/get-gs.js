const https = require('https');
const fs = require('fs');

const cfg = require('C:/Users/gg454/.config/configstore/firebase-tools.json');
const refreshToken = cfg.tokens.refresh_token;
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
  }).toString();
  const tr = await httpRequest(
    {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(params) },
    },
    params
  );
  const token = JSON.parse(tr.body).access_token;

  const PROJECT = 'einherjer-blitz-7578c';
  const r = await httpRequest({
    hostname: 'firebase.googleapis.com',
    path: `/v1beta1/projects/${PROJECT}/androidApps`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });
  const app = (JSON.parse(r.body).apps || []).find((a) => a.packageName === 'com.einherjar.blitz');
  const cr = await httpRequest({
    hostname: 'firebase.googleapis.com',
    path: `/v1beta1/${app.name}/config`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });
  const decoded = Buffer.from(JSON.parse(cr.body).configFileContents, 'base64').toString('utf8');
  fs.writeFileSync('C:/xampp/htdocs/dashboard/Einherjar-Blitz/mobile/google-services.json', decoded);
  console.log('Wrote google-services.json');
  console.log(decoded);
}
main().catch((e) => { console.error(e); process.exit(1); });
