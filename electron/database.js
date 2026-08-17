const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const { seed, seedImages } = require('./seed')

let db

function generateBobineId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = 'BOB-'
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)]
  id += '-'
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'hub-impression-3d.sqlite')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
    migrate()
    const count = db.prepare('SELECT COUNT(*) as n FROM filaments').get().n
    if (count === 0) seed(db)
    seedImages(db)
  }
  return db
}

function migrate() {
  const tryAdd = (sql) => { try { db.exec(sql) } catch (_) {} }
  tryAdd('ALTER TABLE filaments   ADD COLUMN img TEXT')
  tryAdd('ALTER TABLE plateaux    ADD COLUMN img TEXT')
  tryAdd('ALTER TABLE imprimantes ADD COLUMN img TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN nb_bobines INTEGER DEFAULT 1')
  tryAdd('ALTER TABLE filaments   ADD COLUMN poids_restant REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN emplacement TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN poids_bobine_vide REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN poids_avec_bobine REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN type_bobine TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN date_sechage TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN td REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN valeur_k REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN ratio_flux REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN prix_achat REAL')
  tryAdd('ALTER TABLE filaments   ADD COLUMN devise TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN date_achat TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN lien_achat TEXT')
  tryAdd('ALTER TABLE filaments   ADD COLUMN notes_achat TEXT')
  // Ajout Photon Mono M7 Pro
  try {
    db.prepare(`
      INSERT OR IGNORE INTO imprimantes (nom, marque, modele, volume_x, volume_y, volume_z, type_extrudeur, diametre_buse, firmware, notes)
      VALUES (
        'Anycubic Photon Mono M7 Pro', 'Anycubic', 'Photon Mono M7 Pro',
        218.88, 122.88, 260,
        'MSLA / Résine', NULL, 'Anycubic',
        'Imprimante résine MSLA 14K · LightTurbo 3.0 (COB + lentilles Fresnel). Écran LCD 10,1" 13320×5120 px. Vitesse max 170 mm/h (résine haute vitesse) / 130 mm/h (résine standard). Épaisseur de couche : 0,01–0,2 mm. Uniformité lumineuse ≥90 %. Auto-Fill résine + vidange automatique + contrôle thermique cuve. Résines compatibles : ABS-Like, Standard, ABS-Like Pro, Résine haute vitesse 405 nm. Wash & Cure 3 Plus recommandé (nettoyage IPA puis durcissement UV).'
      )
    `).run()
  } catch (_) {}
  // Mise à jour Kobra S1 avec specs complètes
  try {
    db.prepare(`UPDATE imprimantes SET notes = ? WHERE nom = 'Anycubic Kobra S1 Combo' AND (notes IS NULL OR notes NOT LIKE '%CoreXY%')`)
      .run('CoreXY · Klipper. Ace Pro multi-filaments (4 couleurs simultanés). Buse 0.4 mm / max 300 °C. Plateau PEI chauffant max 110 °C. Vitesse max 500 mm/s, accélération max 20 000 mm/s². Volume build 220 × 220 × 250 mm. Extrudeur Direct Drive. Rétraction recommandée : 0.5–0.8 mm. Compatible PLA, PETG, ABS/ASA, TPU, Nylon (enceinte conseillée). PA/Pressure Advance typique PLA : 0.03–0.07.')
  } catch (_) {}
  // Migration des données filaments → bobines (exécutée une seule fois si la table bobines est vide)
  try {
    const bobineCount = db.prepare('SELECT COUNT(*) as n FROM bobines').get().n
    if (bobineCount === 0) {
      const fils = db.prepare('SELECT * FROM filaments').all()
      const ins = db.prepare(`
        INSERT INTO bobines (filament_id, bobine_uid, emplacement, poids_restant, poids_bobine_vide, poids_avec_bobine,
          type_bobine, date_sechage, td, valeur_k, ratio_flux, prix_achat, devise, date_achat, lien_achat, notes_achat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const f of fils) {
        const n = Math.max(1, f.nb_bobines || 1)
        for (let i = 0; i < n; i++) {
          ins.run(
            f.id, generateBobineId(), f.emplacement,
            i === 0 ? f.poids_restant : null,
            f.poids_bobine_vide,
            i === 0 ? f.poids_avec_bobine : null,
            f.type_bobine, f.date_sechage, f.td, f.valeur_k, f.ratio_flux,
            i === 0 ? f.prix_achat : null,
            f.devise || 'EUR',
            i === 0 ? f.date_achat : null,
            i === 0 ? f.lien_achat : null,
            i === 0 ? f.notes_achat : null
          )
        }
      }
    }
  } catch (_) {}
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS imprimantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      marque TEXT,
      modele TEXT,
      volume_x REAL,
      volume_y REAL,
      volume_z REAL,
      type_extrudeur TEXT,
      diametre_buse REAL DEFAULT 0.4,
      firmware TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plateaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL,
      surface TEXT,
      temp_min REAL,
      temp_max REAL,
      preparation TEXT,
      compatible_filaments TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marque TEXT NOT NULL,
      gamme TEXT,
      type TEXT NOT NULL,
      couleur TEXT,
      code_couleur TEXT,
      diametre REAL DEFAULT 1.75,
      temp_buse_min REAL,
      temp_buse_max REAL,
      temp_plateau_min REAL,
      temp_plateau_max REAL,
      vitesse_min REAL,
      vitesse_max REAL,
      retraction_distance REAL,
      retraction_vitesse REAL,
      ventilateur_pct INTEGER DEFAULT 100,
      humidite_sensible INTEGER DEFAULT 0,
      temp_sechage REAL,
      duree_sechage REAL,
      densite REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profils (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      filament_id INTEGER REFERENCES filaments(id) ON DELETE SET NULL,
      imprimante_id INTEGER REFERENCES imprimantes(id) ON DELETE SET NULL,
      plateau_id INTEGER REFERENCES plateaux(id) ON DELETE SET NULL,
      temp_buse REAL,
      temp_plateau REAL,
      vitesse_impression REAL,
      vitesse_perimetre REAL,
      vitesse_remplissage REAL,
      vitesse_deplacement REAL,
      retraction_distance REAL,
      retraction_vitesse REAL,
      ventilateur_pct INTEGER,
      hauteur_couche REAL,
      largeur_extrusion REAL,
      remplissage_pct INTEGER,
      motif_remplissage TEXT,
      perimetre_nb INTEGER DEFAULT 3,
      couches_dessus INTEGER DEFAULT 4,
      couches_dessous INTEGER DEFAULT 4,
      supports INTEGER DEFAULT 0,
      brim_largeur REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bobines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filament_id INTEGER NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
      bobine_uid TEXT NOT NULL DEFAULT '',
      emplacement TEXT,
      poids_restant REAL,
      poids_bobine_vide REAL,
      poids_avec_bobine REAL,
      type_bobine TEXT,
      date_sechage TEXT,
      td REAL,
      valeur_k REAL,
      ratio_flux REAL,
      prix_achat REAL,
      devise TEXT DEFAULT 'EUR',
      date_achat TEXT,
      lien_achat TEXT,
      notes_achat TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ---------- Imprimantes ----------
const imprimantes = {
  getAll: () => getDb().prepare('SELECT * FROM imprimantes ORDER BY nom').all(),
  getById: (id) => getDb().prepare('SELECT * FROM imprimantes WHERE id = ?').get(id),
  create: (data) => {
    const stmt = getDb().prepare(`
      INSERT INTO imprimantes (nom, marque, modele, volume_x, volume_y, volume_z, type_extrudeur, diametre_buse, firmware, notes)
      VALUES (@nom, @marque, @modele, @volume_x, @volume_y, @volume_z, @type_extrudeur, @diametre_buse, @firmware, @notes)
    `)
    const r = stmt.run(data)
    return getDb().prepare('SELECT * FROM imprimantes WHERE id = ?').get(r.lastInsertRowid)
  },
  update: (id, data) => {
    getDb().prepare(`
      UPDATE imprimantes SET nom=@nom, marque=@marque, modele=@modele,
      volume_x=@volume_x, volume_y=@volume_y, volume_z=@volume_z,
      type_extrudeur=@type_extrudeur, diametre_buse=@diametre_buse,
      firmware=@firmware, notes=@notes WHERE id=@id
    `).run({ ...data, id })
    return getDb().prepare('SELECT * FROM imprimantes WHERE id = ?').get(id)
  },
  delete: (id) => getDb().prepare('DELETE FROM imprimantes WHERE id = ?').run(id),
}

// ---------- Plateaux ----------
const plateaux = {
  getAll: () => getDb().prepare('SELECT * FROM plateaux ORDER BY nom').all(),
  getById: (id) => getDb().prepare('SELECT * FROM plateaux WHERE id = ?').get(id),
  create: (data) => {
    const stmt = getDb().prepare(`
      INSERT INTO plateaux (nom, type, surface, temp_min, temp_max, preparation, compatible_filaments, notes)
      VALUES (@nom, @type, @surface, @temp_min, @temp_max, @preparation, @compatible_filaments, @notes)
    `)
    const r = stmt.run(data)
    return getDb().prepare('SELECT * FROM plateaux WHERE id = ?').get(r.lastInsertRowid)
  },
  update: (id, data) => {
    getDb().prepare(`
      UPDATE plateaux SET nom=@nom, type=@type, surface=@surface,
      temp_min=@temp_min, temp_max=@temp_max, preparation=@preparation,
      compatible_filaments=@compatible_filaments, notes=@notes WHERE id=@id
    `).run({ ...data, id })
    return getDb().prepare('SELECT * FROM plateaux WHERE id = ?').get(id)
  },
  delete: (id) => getDb().prepare('DELETE FROM plateaux WHERE id = ?').run(id),
}

// ---------- Filaments ----------
const filaments = {
  getAll: () => {
    const d = getDb()
    const fils = d.prepare('SELECT * FROM filaments ORDER BY marque, type, couleur').all()
    const agg = d.prepare('SELECT filament_id, COUNT(*) as nb_bobines, COALESCE(SUM(poids_restant),0) as poids_total FROM bobines GROUP BY filament_id').all()
    const aggMap = {}
    for (const r of agg) aggMap[r.filament_id] = r
    return fils.map(f => ({
      ...f,
      nb_bobines: aggMap[f.id]?.nb_bobines ?? 0,
      poids_restant: aggMap[f.id]?.poids_total ?? 0,
    }))
  },
  getById: (id) => getDb().prepare('SELECT * FROM filaments WHERE id = ?').get(id),
  create: (data) => {
    const stmt = getDb().prepare(`
      INSERT INTO filaments (marque, gamme, type, couleur, code_couleur, diametre,
        temp_buse_min, temp_buse_max, temp_plateau_min, temp_plateau_max,
        vitesse_min, vitesse_max, retraction_distance, retraction_vitesse,
        ventilateur_pct, humidite_sensible, temp_sechage, duree_sechage, densite, notes,
        poids_bobine_vide, td, valeur_k, ratio_flux)
      VALUES (@marque, @gamme, @type, @couleur, @code_couleur, @diametre,
        @temp_buse_min, @temp_buse_max, @temp_plateau_min, @temp_plateau_max,
        @vitesse_min, @vitesse_max, @retraction_distance, @retraction_vitesse,
        @ventilateur_pct, @humidite_sensible, @temp_sechage, @duree_sechage, @densite, @notes,
        @poids_bobine_vide, @td, @valeur_k, @ratio_flux)
    `)
    const r = stmt.run(data)
    return getDb().prepare('SELECT * FROM filaments WHERE id = ?').get(r.lastInsertRowid)
  },
  update: (id, data) => {
    getDb().prepare(`
      UPDATE filaments SET marque=@marque, gamme=@gamme, type=@type, couleur=@couleur,
      code_couleur=@code_couleur, diametre=@diametre,
      temp_buse_min=@temp_buse_min, temp_buse_max=@temp_buse_max,
      temp_plateau_min=@temp_plateau_min, temp_plateau_max=@temp_plateau_max,
      vitesse_min=@vitesse_min, vitesse_max=@vitesse_max,
      retraction_distance=@retraction_distance, retraction_vitesse=@retraction_vitesse,
      ventilateur_pct=@ventilateur_pct, humidite_sensible=@humidite_sensible,
      temp_sechage=@temp_sechage, duree_sechage=@duree_sechage,
      densite=@densite, notes=@notes,
      poids_bobine_vide=@poids_bobine_vide, td=@td, valeur_k=@valeur_k, ratio_flux=@ratio_flux
      WHERE id=@id
    `).run({ ...data, id })
    return getDb().prepare('SELECT * FROM filaments WHERE id = ?').get(id)
  },
  delete: (id) => getDb().prepare('DELETE FROM filaments WHERE id = ?').run(id),
}

// ---------- Bobines ----------
const bobines = {
  getByFilament: (filament_id) =>
    getDb().prepare('SELECT * FROM bobines WHERE filament_id = ? ORDER BY created_at ASC').all(filament_id),
  create: (data) => {
    const uid = data.bobine_uid || generateBobineId()
    const stmt = getDb().prepare(`
      INSERT INTO bobines (filament_id, bobine_uid, emplacement, poids_restant, poids_bobine_vide, poids_avec_bobine,
        type_bobine, date_sechage, td, valeur_k, ratio_flux, prix_achat, devise, date_achat, lien_achat, notes_achat, notes)
      VALUES (@filament_id, @bobine_uid, @emplacement, @poids_restant, @poids_bobine_vide, @poids_avec_bobine,
        @type_bobine, @date_sechage, @td, @valeur_k, @ratio_flux, @prix_achat, @devise, @date_achat, @lien_achat, @notes_achat, @notes)
    `)
    const r = stmt.run({ ...data, bobine_uid: uid })
    return getDb().prepare('SELECT * FROM bobines WHERE id = ?').get(r.lastInsertRowid)
  },
  update: (id, data) => {
    getDb().prepare(`
      UPDATE bobines SET emplacement=@emplacement, poids_restant=@poids_restant,
      poids_bobine_vide=@poids_bobine_vide, poids_avec_bobine=@poids_avec_bobine,
      type_bobine=@type_bobine, date_sechage=@date_sechage,
      td=@td, valeur_k=@valeur_k, ratio_flux=@ratio_flux,
      prix_achat=@prix_achat, devise=@devise, date_achat=@date_achat,
      lien_achat=@lien_achat, notes_achat=@notes_achat, notes=@notes,
      updated_at=datetime('now') WHERE id=@id
    `).run({ ...data, id })
    return getDb().prepare('SELECT * FROM bobines WHERE id = ?').get(id)
  },
  delete: (id) => getDb().prepare('DELETE FROM bobines WHERE id = ?').run(id),
  patch: (id, fields) => {
    const allowed = ['poids_restant', 'emplacement', 'poids_avec_bobine', 'poids_bobine_vide']
    const safe = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))
    if (!Object.keys(safe).length) return getDb().prepare('SELECT * FROM bobines WHERE id = ?').get(id)
    for (const k of Object.keys(safe)) { if (safe[k] === '') safe[k] = null }
    const sets = Object.keys(safe).map(k => `${k}=@${k}`).join(', ')
    getDb().prepare(`UPDATE bobines SET ${sets}, updated_at=datetime('now') WHERE id=@id`).run({ ...safe, id })
    return getDb().prepare('SELECT * FROM bobines WHERE id = ?').get(id)
  },
}

// ---------- Profils ----------
const profils = {
  getAll: () => getDb().prepare(`
    SELECT p.*, f.marque as f_marque, f.type as f_type, f.couleur as f_couleur,
           i.nom as i_nom, pl.nom as pl_nom
    FROM profils p
    LEFT JOIN filaments f ON p.filament_id = f.id
    LEFT JOIN imprimantes i ON p.imprimante_id = i.id
    LEFT JOIN plateaux pl ON p.plateau_id = pl.id
    ORDER BY p.nom
  `).all(),
  getById: (id) => getDb().prepare(`
    SELECT p.*, f.marque as f_marque, f.type as f_type, f.couleur as f_couleur,
           i.nom as i_nom, pl.nom as pl_nom
    FROM profils p
    LEFT JOIN filaments f ON p.filament_id = f.id
    LEFT JOIN imprimantes i ON p.imprimante_id = i.id
    LEFT JOIN plateaux pl ON p.plateau_id = pl.id
    WHERE p.id = ?
  `).get(id),
  create: (data) => {
    const stmt = getDb().prepare(`
      INSERT INTO profils (nom, filament_id, imprimante_id, plateau_id,
        temp_buse, temp_plateau, vitesse_impression, vitesse_perimetre,
        vitesse_remplissage, vitesse_deplacement, retraction_distance, retraction_vitesse,
        ventilateur_pct, hauteur_couche, largeur_extrusion, remplissage_pct,
        motif_remplissage, perimetre_nb, couches_dessus, couches_dessous,
        supports, brim_largeur, notes)
      VALUES (@nom, @filament_id, @imprimante_id, @plateau_id,
        @temp_buse, @temp_plateau, @vitesse_impression, @vitesse_perimetre,
        @vitesse_remplissage, @vitesse_deplacement, @retraction_distance, @retraction_vitesse,
        @ventilateur_pct, @hauteur_couche, @largeur_extrusion, @remplissage_pct,
        @motif_remplissage, @perimetre_nb, @couches_dessus, @couches_dessous,
        @supports, @brim_largeur, @notes)
    `)
    const r = stmt.run(data)
    return profils.getById(r.lastInsertRowid)
  },
  update: (id, data) => {
    getDb().prepare(`
      UPDATE profils SET nom=@nom, filament_id=@filament_id, imprimante_id=@imprimante_id,
      plateau_id=@plateau_id, temp_buse=@temp_buse, temp_plateau=@temp_plateau,
      vitesse_impression=@vitesse_impression, vitesse_perimetre=@vitesse_perimetre,
      vitesse_remplissage=@vitesse_remplissage, vitesse_deplacement=@vitesse_deplacement,
      retraction_distance=@retraction_distance, retraction_vitesse=@retraction_vitesse,
      ventilateur_pct=@ventilateur_pct, hauteur_couche=@hauteur_couche,
      largeur_extrusion=@largeur_extrusion, remplissage_pct=@remplissage_pct,
      motif_remplissage=@motif_remplissage, perimetre_nb=@perimetre_nb,
      couches_dessus=@couches_dessus, couches_dessous=@couches_dessous,
      supports=@supports, brim_largeur=@brim_largeur, notes=@notes WHERE id=@id
    `).run({ ...data, id })
    return profils.getById(id)
  },
  delete: (id) => getDb().prepare('DELETE FROM profils WHERE id = ?').run(id),
}

// ---------- Stats dashboard ----------
const stats = {
  get: () => {
    const d = getDb()
    const stock = d.prepare('SELECT COUNT(*) as bobines, COALESCE(SUM(poids_restant),0) as poids FROM bobines').get()
    const ace_bobines = d.prepare(`
      SELECT b.id, b.poids_restant, b.emplacement, b.filament_id,
             f.marque, f.gamme, f.type, f.couleur, f.code_couleur
      FROM bobines b
      JOIN filaments f ON b.filament_id = f.id
      WHERE b.emplacement LIKE 'Ace Pro%'
      ORDER BY b.emplacement ASC
    `).all()
    return {
      filaments:     d.prepare('SELECT COUNT(*) as n FROM filaments').get().n,
      imprimantes:   d.prepare('SELECT COUNT(*) as n FROM imprimantes').get().n,
      plateaux:      d.prepare('SELECT COUNT(*) as n FROM plateaux').get().n,
      profils:       d.prepare('SELECT COUNT(*) as n FROM profils').get().n,
      types:         d.prepare("SELECT type, COUNT(*) as n FROM filaments GROUP BY type ORDER BY n DESC").all(),
      marques:       d.prepare("SELECT marque, COUNT(*) as n FROM filaments GROUP BY marque ORDER BY n DESC LIMIT 5").all(),
      total_bobines: stock.bobines,
      total_poids:   stock.poids,
      ace_bobines,
    }
  },
}

module.exports = { imprimantes, plateaux, filaments, bobines, profils, stats }
