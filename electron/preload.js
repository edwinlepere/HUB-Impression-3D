const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Filaments
  filaments: {
    getAll:  ()       => ipcRenderer.invoke('filaments:getAll'),
    getById: (id)     => ipcRenderer.invoke('filaments:getById', id),
    create:  (data)   => ipcRenderer.invoke('filaments:create', data),
    update:  (id, d)  => ipcRenderer.invoke('filaments:update', id, d),
    delete:  (id)     => ipcRenderer.invoke('filaments:delete', id),
  },
  // Imprimantes
  imprimantes: {
    getAll:  ()       => ipcRenderer.invoke('imprimantes:getAll'),
    getById: (id)     => ipcRenderer.invoke('imprimantes:getById', id),
    create:  (data)   => ipcRenderer.invoke('imprimantes:create', data),
    update:  (id, d)  => ipcRenderer.invoke('imprimantes:update', id, d),
    delete:  (id)     => ipcRenderer.invoke('imprimantes:delete', id),
  },
  // Plateaux
  plateaux: {
    getAll:  ()       => ipcRenderer.invoke('plateaux:getAll'),
    getById: (id)     => ipcRenderer.invoke('plateaux:getById', id),
    create:  (data)   => ipcRenderer.invoke('plateaux:create', data),
    update:  (id, d)  => ipcRenderer.invoke('plateaux:update', id, d),
    delete:  (id)     => ipcRenderer.invoke('plateaux:delete', id),
  },
  // Bobines
  bobines: {
    getByFilament: (filament_id) => ipcRenderer.invoke('bobines:getByFilament', filament_id),
    create:        (data)        => ipcRenderer.invoke('bobines:create', data),
    update:        (id, d)       => ipcRenderer.invoke('bobines:update', id, d),
    patch:         (id, fields)  => ipcRenderer.invoke('bobines:patch', id, fields),
    delete:        (id)          => ipcRenderer.invoke('bobines:delete', id),
  },
  // Profils
  profils: {
    getAll:  ()       => ipcRenderer.invoke('profils:getAll'),
    getById: (id)     => ipcRenderer.invoke('profils:getById', id),
    create:  (data)   => ipcRenderer.invoke('profils:create', data),
    update:  (id, d)  => ipcRenderer.invoke('profils:update', id, d),
    delete:  (id)     => ipcRenderer.invoke('profils:delete', id),
  },
  // Stats
  stats: {
    get: () => ipcRenderer.invoke('stats:get'),
  },
  // Dialogs
  dialog: {
    openFile: (opts) => ipcRenderer.invoke('dialog:openFile', opts),
    saveFile: (opts) => ipcRenderer.invoke('dialog:saveFile', opts),
  },
  // Filesystem
  fs: {
    readFile:  (p)    => ipcRenderer.invoke('fs:readFile', p),
    writeFile: (p, c) => ipcRenderer.invoke('fs:writeFile', p, c),
  },
})
