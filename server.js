'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const ADMIN_USER = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || '';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const sessions = new Map();
const attempts = new Map();

if (!ADMIN_USER || !ADMIN_PASSWORD_SALT || !ADMIN_PASSWORD_HASH) {
  console.warn('WARNING: ADMIN_USERNAME, ADMIN_PASSWORD_SALT and ADMIN_PASSWORD_HASH must be configured for admin login.');
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ flights: [], enquiries: [], content: {} }, null, 2));
  }
}
function readDb() { ensureDb(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function json(res, status, body) { const data = JSON.stringify(body); res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(data); }
function body(req) { return new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>{raw+=c;if(raw.length>1e6) req.destroy();}); req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch(e){reject(e);}}); req.on('error',reject); }); }
function hash(password, salt) { return crypto.pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex'); }
function verifyPassword(password) {
  if (!ADMIN_PASSWORD_SALT || !ADMIN_PASSWORD_HASH) return false;
  const derived = Buffer.from(hash(password, ADMIN_PASSWORD_SALT),'hex');
  const stored = Buffer.from(ADMIN_PASSWORD_HASH,'hex');
  return derived.length === stored.length && crypto.timingSafeEqual(derived, stored);
}
function auth(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  const s = sessions.get(token);
  if (!s || s.expires < Date.now()) { if(token) sessions.delete(token); return false; }
  s.expires = Date.now() + 8*60*60*1000;
  return true;
}
function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const file = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.normalize(path.join(PUBLIC_DIR, file));
  if (!resolved.startsWith(PUBLIC_DIR)) return null;
  return resolved;
}
function mime(file) { return {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.json':'application/json'}[path.extname(file).toLowerCase()] || 'application/octet-stream'; }

async function handleApi(req,res,url) {
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const ip = req.socket.remoteAddress || 'unknown';
    const a = attempts.get(ip) || {count:0, until:0};
    if (a.until > Date.now()) return json(res,429,{error:'Too many login attempts. Try again later.'});
    const b = await body(req);
    if (b.username !== ADMIN_USER || !verifyPassword(String(b.password || ''))) {
      a.count++; if(a.count >= 8){a.until=Date.now()+15*60*1000;a.count=0;} attempts.set(ip,a);
      return json(res,401,{error:'Invalid admin credentials.'});
    }
    attempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token,{expires:Date.now()+8*60*60*1000});
    return json(res,200,{token,expiresIn:28800});
  }
  if (url.pathname === '/api/flights' && req.method === 'GET') return json(res,200,readDb().flights);
  if (url.pathname === '/api/enquiries' && req.method === 'POST') {
    const b=await body(req); if(!b.ref || !b.type) return json(res,400,{error:'Invalid enquiry'});
    const db=readDb(); db.enquiries.unshift(b); db.enquiries=db.enquiries.slice(0,5000); writeDb(db); return json(res,201,{ok:true,ref:b.ref});
  }
  if (url.pathname.startsWith('/api/enquiries/') && req.method === 'GET') {
    const ref=decodeURIComponent(url.pathname.split('/').pop()).toUpperCase();
    const item=readDb().enquiries.find(x=>String(x.ref).toUpperCase()===ref);
    return item ? json(res,200,{ref:item.ref,type:item.type,status:item.status,createdAt:item.createdAt}) : json(res,404,{error:'Enquiry not found'});
  }
  if (!auth(req)) return json(res,401,{error:'Authentication required.'});
  if (url.pathname === '/api/auth/me' && req.method === 'GET') return json(res,200,{username:ADMIN_USER});
  if (url.pathname === '/api/flights' && req.method === 'PUT') { const b=await body(req); if(!b.id) return json(res,400,{error:'Flight id required'}); const db=readDb(); const i=db.flights.findIndex(x=>x.id===b.id); if(i<0) db.flights.push(b); else db.flights[i]=b; writeDb(db); return json(res,200,b); }
  if (url.pathname.startsWith('/api/flights/') && req.method === 'DELETE') { const id=decodeURIComponent(url.pathname.split('/').pop()); const db=readDb(); db.flights=db.flights.filter(x=>x.id!==id); writeDb(db); return json(res,200,{ok:true}); }
  if (url.pathname === '/api/enquiries' && req.method === 'GET') return json(res,200,readDb().enquiries);
  if (url.pathname.startsWith('/api/enquiries/') && req.method === 'PATCH') { const ref=decodeURIComponent(url.pathname.split('/').pop()).toUpperCase(); const b=await body(req); const db=readDb(); const item=db.enquiries.find(x=>String(x.ref).toUpperCase()===ref); if(!item)return json(res,404,{error:'Not found'}); if(b.status)item.status=b.status; writeDb(db); return json(res,200,item); }
  if (url.pathname === '/api/content' && req.method === 'GET') return json(res,200,readDb().content);
  if (url.pathname === '/api/content' && req.method === 'PUT') { const db=readDb(); db.content=await body(req); writeDb(db); return json(res,200,db.content); }
  return json(res,404,{error:'API route not found'});
}

const server=http.createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(url.pathname.startsWith('/api/')) return await handleApi(req,res,url);
    if(req.method!=='GET' && req.method!=='HEAD') return json(res,405,{error:'Method not allowed'});
    const file=safePath(url.pathname); if(!file) return json(res,403,{error:'Forbidden'});
    fs.stat(file,(err,st)=>{ if(err||!st.isFile()) return json(res,404,{error:'Not found'}); res.writeHead(200,{'Content-Type':mime(file),'X-Content-Type-Options':'nosniff','Cache-Control':path.extname(file)==='.html'?'no-cache':'public, max-age=3600'}); if(req.method==='HEAD')return res.end(); fs.createReadStream(file).pipe(res); });
  } catch(e) { console.error(e); json(res,500,{error:'Server error'}); }
});
ensureDb(); server.listen(PORT,HOST,()=>console.log(`Travel Nepway V4 server: http://${HOST}:${PORT}`));
