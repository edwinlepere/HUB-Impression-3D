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
    INSERT INTO plateaux (nom, type, surface, temp_min, temp_max, preparation, compatible_filaments, img, notes)
    SELECT @nom, @type, @surface, @temp_min, @temp_max, @preparation, @compatible_filaments, @img, @notes
    WHERE NOT EXISTS (SELECT 1 FROM plateaux WHERE nom = @nom)
  `)
  for (const p of plateaux) insertPlateau.run(p)
}

module.exports = { seed, seedImages }
