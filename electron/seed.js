// Données extraites de techfixbuild.fr/guide-impression-3d

// Mapping couleur → image filament
const FILAMENT_IMGS = {
  'Beige_PLA':           'beige-pla-basique.webp',
  'Blanc_PLA':           'blanc-pla-basique.webp',
  'Bleu_PLA':            'bleu-pla-basique.webp',
  'Bleu Phospho_PLA':    'bleu-pla-glow.webp',
  'Bleu_TPU':            'bleu-tpu-basique.webp',
  'Gris_PLA':            'gris-pla-hautevitesse.webp',
  'Jaune_PLA':           'jaune-pla-basique.webp',
  'Marron_PLA':          'marron-pla-mat.webp',
  'Noir Metal_PLA':      'noir-metal-pla-metal.webp',
  'Noir_PETG':           'noir-petg-basique.webp',
  'Noir_PLA':            'noir-pla-basique.webp',
  'Rose Pêche_PLA':      'rose-peche-pla-basique.webp',
  'Rose_PLA':            'rose-pla-silk.webp',
  'Rouge_PLA':           'rouge-pla-basique.webp',
  'Texture Gris_PLA':    'texture-gris-pla-basique.webp',
  'Vert Noël_PLA':       'vert-noel-pla-silk.webp',
  'Vert_PLA':            'vert-pla-basique.webp',
  'Violet_PLA':          'violet-pla-basique.webp',
}

const PLATEAU_IMGS = {
  'Carbon Fiber / Diamond Dark':    'carbon-diamond.webp',
  'PEI Double Texture':             'pei-double-texture.webp',
  'PEI Texturée / Lisse':           'pei-texture-lisse.webp',
  'GECO-PLATE':                     'geco.webp',
  'Holographique Rainbow / Gold':   'holo-rainbow-gold.webp',
  'Holographique Shards / Silver':  'holo-shards-silver.webp',
  'JUUPINE Honeycomb / Cube Gold':  'juupine-gold.webp',
  'Neon Lines / Diamond Grid':      'neon-lines-grid.webp',
}

const PRINTER_IMGS = {
  'Anycubic Kobra S1 Combo': 'kobra-s1.webp',
  'Anycubic Photon Mono 4':  'photon-mono4.webp',
}

// Met à jour les images sur des enregistrements déjà existants
function seedImages(db) {
  // Filaments
  const fils = db.prepare('SELECT id, couleur, type FROM filaments').all()
  const updFil = db.prepare(`UPDATE filaments SET img = ? WHERE id = ? AND (img IS NULL OR img = '')`)
  for (const f of fils) {
    const key = `${f.couleur}_${f.type}`
    const img = FILAMENT_IMGS[key]
    if (img) updFil.run(img, f.id)
  }
  // Plateaux
  const plats = db.prepare('SELECT id, nom FROM plateaux').all()
  const updPlat = db.prepare(`UPDATE plateaux SET img = ? WHERE id = ? AND (img IS NULL OR img = '')`)
  for (const p of plats) {
    const img = PLATEAU_IMGS[p.nom]
    if (img) updPlat.run(img, p.id)
  }
  // Imprimantes
  const imps = db.prepare('SELECT id, nom FROM imprimantes').all()
  const updImp = db.prepare(`UPDATE imprimantes SET img = ? WHERE id = ? AND (img IS NULL OR img = '')`)
  for (const i of imps) {
    const img = PRINTER_IMGS[i.nom]
    if (img) updImp.run(img, i.id)
  }
}

function seed(db) {
  // ── Imprimantes ─────────────────────────────────────────────────────────────
  db.prepare(`
    INSERT OR IGNORE INTO imprimantes (id, nom, marque, modele, volume_x, volume_y, volume_z, type_extrudeur, diametre_buse, firmware, img, notes)
    VALUES (1, 'Anycubic Kobra S1 Combo', 'Anycubic', 'Kobra S1 Combo', 220, 220, 250, 'Direct Drive', 0.4, 'Anycubic', 'kobra-s1.webp',
      'Impression haute performance, multi-matériaux. Compatible PLA (toutes finitions), PETG, TPU, ABS, ASA — plateau chauffant, grand volume de build.')
  `).run()

  // ── Plateaux ────────────────────────────────────────────────────────────────
  const plateaux = [
    { nom: 'Carbon Fiber / Diamond Dark',   type: 'Autre',       surface: "Face A : Carbone — Face B : Diamond Dark",       temp_min: 0, temp_max: 110, preparation: 'Nettoyage IPA avant impression', compatible_filaments: 'PLA, PETG',            img: 'carbon-diamond.webp',   notes: 'Rendu carbone sur une face, motif géométrique sombre sur l\'autre. Finition mate premium.' },
    { nom: 'PEI Double Texture',            type: 'PEI texturé', surface: "Face A : Texturée — Face B : Texturée",           temp_min: 0, temp_max: 120, preparation: 'Nettoyage IPA. Laisser refroidir complètement avant retrait (PETG surtout).', compatible_filaments: 'PLA, PETG, ABS, ASA', img: 'pei-double-texture.webp', notes: 'Double face texturée noire. Polyvalente, compatible avec la plupart des filaments.' },
    { nom: 'PEI Texturée / Lisse',          type: 'PEI texturé', surface: "Face A : Texturée — Face B : Lisse",             temp_min: 0, temp_max: 120, preparation: 'Nettoyage IPA. Retirer à froid.',                                              compatible_filaments: 'PLA, PETG, ABS',       img: 'pei-texture-lisse.webp',  notes: 'Granuleux mat d\'un côté, finition brillante de l\'autre.' },
    { nom: 'GECO-PLATE',                    type: 'Autre',       surface: "Face A : Grid Bleu — Face B : Grid Bleu (miroir)", temp_min: 0, temp_max: 60,  preparation: 'Aucune chauffe requise pour PLA.',                                           compatible_filaments: 'PLA',                  img: 'geco.webp',               notes: 'Design grille cyber bleu/vert. Sans chauffe requise. Compatible PLA uniquement sans chauffage.' },
    { nom: 'Holographique Rainbow / Gold',  type: 'Autre',       surface: "Face A : Holo Rainbow — Face B : Gold Diamond",   temp_min: 0, temp_max: 90,  preparation: 'Nettoyage IPA. L\'effet holo est visible sur le dessous de la pièce.',     compatible_filaments: 'PLA, PETG',            img: 'holo-rainbow-gold.webp',  notes: 'Paillettes arc-en-ciel d\'un côté, triangles dorés de l\'autre. Très populaire pour figurines et déco premium.' },
    { nom: 'Holographique Shards / Silver', type: 'Autre',       surface: "Face A : Holo Shards — Face B : Silver Diamond",  temp_min: 0, temp_max: 90,  preparation: 'Nettoyage IPA. L\'effet holo est visible sur le dessous de la pièce.',     compatible_filaments: 'PLA, PETG',            img: 'holo-shards-silver.webp', notes: 'Éclats multicolores sur une face, triangles argentés sur l\'autre.' },
    { nom: 'JUUPINE Honeycomb / Cube Gold', type: 'Autre',       surface: "Face A : Nid d'abeille — Face B : Cubes 3D",      temp_min: 0, temp_max: 110, preparation: 'Nettoyage IPA.',                                                            compatible_filaments: 'PLA, PETG, ABS',       img: 'juupine-gold.webp',       notes: 'Finition dorée. Nid d\'abeille d\'un côté, cubes 3D de l\'autre. Idéal figurines de collection, déco, cadeaux.' },
    { nom: 'Neon Lines / Diamond Grid',     type: 'Autre',       surface: "Face A : Neon Lines — Face B : Diamond Grid",     temp_min: 0, temp_max: 90,  preparation: 'Nettoyage IPA.',                                                            compatible_filaments: 'PLA, PETG',            img: 'neon-lines-grid.webp',    notes: 'Lignes laser néon sur fond noir, grille de diamants holographiques. Esthétique gaming / futuriste.' },
  ]

  const insertPlateau = db.prepare(`
    INSERT OR IGNORE INTO plateaux (nom, type, surface, temp_min, temp_max, preparation, compatible_filaments, img, notes)
    VALUES (@nom, @type, @surface, @temp_min, @temp_max, @preparation, @compatible_filaments, @img, @notes)
  `)
  for (const p of plateaux) insertPlateau.run(p)

  // ── Filaments ───────────────────────────────────────────────────────────────
  const filaments = [
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Beige',        code_couleur: '#D4B996', img: 'beige-pla-basique.webp',        diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique. ~60°C. ±0,2mm. Décoration, figurines, prototypes.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Blanc',        code_couleur: '#FFFFFF', img: 'blanc-pla-basique.webp',        diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Bleu',         code_couleur: '#247CDB', img: 'bleu-pla-basique.webp',         diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Jaune',        code_couleur: '#F3E500', img: 'jaune-pla-basique.webp',        diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Noir',         code_couleur: '#111111', img: 'noir-pla-basique.webp',         diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Rose Pêche',   code_couleur: '#FFC196', img: 'rose-peche-pla-basique.webp',   diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Rouge',        code_couleur: '#C8102E', img: 'rouge-pla-basique.webp',        diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Texture Gris', code_couleur: '#75787B', img: 'texture-gris-pla-basique.webp', diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Vert',         code_couleur: '#009639', img: 'vert-pla-basique.webp',         diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PLA',  couleur: 'Violet',       code_couleur: '#6A6DCD', img: 'violet-pla-basique.webp',       diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Basique.' },
    { marque: 'Stock TFB', gamme: 'Silk',          type: 'PLA',  couleur: 'Rose',         code_couleur: '#FCAFC0', img: 'rose-pla-silk.webp',            diametre: 1.75, temp_buse_min: 200, temp_buse_max: 230, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 40,  vitesse_max: 150, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Silk. Finition satinée brillante, rendu premium.' },
    { marque: 'Stock TFB', gamme: 'Silk',          type: 'PLA',  couleur: 'Vert Noël',    code_couleur: '#008755', img: 'vert-noel-pla-silk.webp',       diametre: 1.75, temp_buse_min: 200, temp_buse_max: 230, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 40,  vitesse_max: 150, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Silk. Finition satinée brillante, rendu premium.' },
    { marque: 'Stock TFB', gamme: 'Metal',         type: 'PLA',  couleur: 'Noir Metal',   code_couleur: '#43403D', img: 'noir-metal-pla-metal.webp',     diametre: 1.75, temp_buse_min: 200, temp_buse_max: 230, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 40,  vitesse_max: 120, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.3,  notes: 'PLA Metal. Particules métalliques — aspect acier brossé. Buse durcie recommandée.' },
    { marque: 'Stock TFB', gamme: 'Glow',          type: 'PLA',  couleur: 'Bleu Phospho', code_couleur: '#00AFD7', img: 'bleu-pla-glow.webp',            diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 180, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Glow. Phosphorescent — brille dans le noir 15–30 min.' },
    { marque: 'Stock TFB', gamme: 'Mat',           type: 'PLA',  couleur: 'Marron',       code_couleur: '#927968', img: 'marron-pla-mat.webp',           diametre: 1.75, temp_buse_min: 190, temp_buse_max: 220, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 50,  vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Mat. Surface mate sans reflets, rendu professionnel.' },
    { marque: 'Stock TFB', gamme: 'Haute Vitesse', type: 'PLA',  couleur: 'Gris',         code_couleur: '#696C6D', img: 'gris-pla-hautevitesse.webp',    diametre: 1.75, temp_buse_min: 210, temp_buse_max: 240, temp_plateau_min: 45, temp_plateau_max: 65,  vitesse_min: 100, vitesse_max: 600, retraction_distance: 0.5, retraction_vitesse: 60, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4, densite: 1.24, notes: 'PLA Haute Vitesse. Formulé pour imprimer 2–3× plus vite.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'PETG', couleur: 'Noir',         code_couleur: '#111111', img: 'noir-petg-basique.webp',        diametre: 1.75, temp_buse_min: 230, temp_buse_max: 250, temp_plateau_min: 70, temp_plateau_max: 85,  vitesse_min: 30,  vitesse_max: 100, retraction_distance: 1.0, retraction_vitesse: 35, ventilateur_pct: 50,  humidite_sensible: 1, temp_sechage: 65, duree_sechage: 6, densite: 1.27, notes: 'PETG Basique. ~80°C. ±0,2mm. Pièces fonctionnelles, usage extérieur. ATTENTION : colle aux plateaux PEI — laisser refroidir complètement.' },
    { marque: 'Stock TFB', gamme: 'Basique',       type: 'TPU',  couleur: 'Bleu',         code_couleur: '#005EB8', img: 'bleu-tpu-basique.webp',         diametre: 1.75, temp_buse_min: 220, temp_buse_max: 240, temp_plateau_min: 30, temp_plateau_max: 60,  vitesse_min: 15,  vitesse_max: 40,  retraction_distance: 0.5, retraction_vitesse: 25, ventilateur_pct: 100, humidite_sensible: 1, temp_sechage: 60, duree_sechage: 8, densite: 1.21, notes: 'TPU Flexible. ~80°C. ±0,3mm. IMPRESSION LENTE OBLIGATOIRE. Coques téléphone, joints, semelles.' },
  ]

  const insertFilament = db.prepare(`
    INSERT OR IGNORE INTO filaments
      (marque, gamme, type, couleur, code_couleur, img, diametre,
       temp_buse_min, temp_buse_max, temp_plateau_min, temp_plateau_max,
       vitesse_min, vitesse_max, retraction_distance, retraction_vitesse,
       ventilateur_pct, humidite_sensible, temp_sechage, duree_sechage, densite, notes)
    VALUES
      (@marque, @gamme, @type, @couleur, @code_couleur, @img, @diametre,
       @temp_buse_min, @temp_buse_max, @temp_plateau_min, @temp_plateau_max,
       @vitesse_min, @vitesse_max, @retraction_distance, @retraction_vitesse,
       @ventilateur_pct, @humidite_sensible, @temp_sechage, @duree_sechage, @densite, @notes)
  `)
  for (const f of filaments) insertFilament.run(f)
}

module.exports = { seed, seedImages }
