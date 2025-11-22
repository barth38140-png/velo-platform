const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');

// ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

async function uploadPhotosHandler(req, res) {
  const { requestId } = req.params;
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    // Verify repair request exists and belongs to user
    const r = await pool.query('SELECT * FROM repair_requests WHERE id = $1', [requestId]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Repair request not found' });
    if (r.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    const inserted = [];
    for (const f of req.files) {
      const filepath = path.relative(path.join(__dirname, '..'), f.path).replace(/\\/g, '/');
      const q = await pool.query(
        'INSERT INTO repair_request_photos (repair_request_id, filename, filepath) VALUES ($1, $2, $3) RETURNING *',
        [requestId, f.originalname, filepath]
      );
      inserted.push(q.rows[0]);
    }

    res.json({ success: true, photos: inserted });
  } catch (err) {
    console.error('uploadPhotosHandler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { upload, uploadPhotosHandler };

// Serve a photo file with authorization check
async function getPhotoHandler(req, res) {
  const { photoId } = req.params;
  const userId = req.user.id;

  try {
    const q = await pool.query(
      `SELECT p.id, p.filename, p.filepath, rr.id AS repair_request_id, rr.user_id AS owner_id, rr.assigned_repairer_id, rr.status
       FROM repair_request_photos p
       JOIN repair_requests rr ON p.repair_request_id = rr.id
       WHERE p.id = $1`,
      [photoId]
    );
    const row = q.rows[0];
    if (!row) return res.status(404).json({ error: 'Photo not found' });

    // Allow access to owner or assigned repairer
    if (row.owner_id === userId || row.assigned_repairer_id === userId) {
      const absolutePath = path.resolve(__dirname, '..', row.filepath);
      if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found on server' });
      return res.sendFile(absolutePath);
    }

    // If the request is still pending, allow users with role 'repairer' to preview photos
    if (row.status === 'pending') {
      const ru = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      const role = ru.rows[0] && ru.rows[0].role;
      if (role === 'repairer') {
        const absolutePath = path.resolve(__dirname, '..', row.filepath);
        if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found on server' });
        return res.sendFile(absolutePath);
      }
    }

    return res.status(403).json({ error: 'Not authorized to access this photo' });
  } catch (err) {
    console.error('getPhotoHandler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { upload, uploadPhotosHandler, getPhotoHandler };
