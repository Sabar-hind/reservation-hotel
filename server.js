const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'reservations.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function readReservations() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeReservations(reservations) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2), 'utf8');
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        reject(new Error('Corps de requête trop volumineux'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier non trouvé');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
}

function validateReservation(data) {
  const errors = [];
  const nom = (data.nom || '').trim();
  const email = (data.email || '').trim();
  const hotel = (data.hotel || '').trim();
  const chambre = (data.chambre || '').trim();
  const dateArrivee = (data.dateArrivee || '').trim();
  const dateDepart = (data.dateDepart || '').trim();
  const personnes = Number(data.personnes);

  if (!nom) errors.push('Le nom est obligatoire.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Un email valide est obligatoire.');
  }
  if (!hotel) errors.push("Le nom de l'hôtel est obligatoire.");
  if (!chambre) errors.push('Le type de chambre est obligatoire.');
  if (!dateArrivee) errors.push("La date d'arrivée est obligatoire.");
  if (!dateDepart) errors.push('La date de départ est obligatoire.');
  if (dateArrivee && dateDepart && dateDepart <= dateArrivee) {
    errors.push('La date de départ doit être après la date d\'arrivée.');
  }
  if (!personnes || personnes < 1 || personnes > 10) {
    errors.push('Le nombre de personnes doit être entre 1 et 10.');
  }

  return {
    valid: errors.length === 0,
    errors,
    reservation: {
      nom,
      email,
      hotel,
      chambre,
      dateArrivee,
      dateDepart,
      personnes,
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (pathname === '/api/reservations' && req.method === 'GET') {
    const reservations = readReservations();
    sendJson(res, 200, { success: true, reservations });
    return;
  }

  if (pathname === '/api/reservations' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { valid, errors, reservation } = validateReservation(body);

      if (!valid) {
        sendJson(res, 400, { success: false, errors });
        return;
      }

      const reservations = readReservations();
      const newReservation = {
        id: Date.now(),
        ...reservation,
        createdAt: new Date().toISOString(),
      };

      reservations.unshift(newReservation);
      writeReservations(reservations);

      sendJson(res, 201, {
        success: true,
        message: 'Réservation ajoutée avec succès.',
        reservation: newReservation,
      });
    } catch (err) {
      sendJson(res, 400, {
        success: false,
        errors: [err.message || 'Erreur lors du traitement de la requête.'],
      });
    }
    return;
  }

  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Accès refusé');
    return;
  }

  if (!path.extname(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré : http://localhost:${PORT}`);
  console.log(`API GET  : http://localhost:${PORT}/api/reservations`);
  console.log(`API POST : http://localhost:${PORT}/api/reservations`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Erreur : le port ${PORT} est déjà utilisé.`);
    console.error('Solution : fermez l\'autre instance du serveur, ou lancez :');
    console.error(`  $env:PORT=3001; node server.js`);
    process.exit(1);
  }
  throw err;
});
