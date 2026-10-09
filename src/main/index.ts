import { app, Menu } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { createWindow, getMainWindow } from './window'
import { createTray } from './tray'
import { registerIpc, watchIdleLock, watchMinimizeLock } from './ipc'
import { lockVault } from './services/vault'

app.setName('Lumina')
app.setAppUserModelId('app.lumina.authenticator')

const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
if (portableDir) {
  const dataDir = join(portableDir, 'LuminaData')
  mkdirSync(dataDir, { recursive: true })
  app.setPath('userData', dataDir)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    registerIpc()
    const win = createWindow()
    createTray()
    watchIdleLock()
    watchMinimizeLock(win)
  })
}

app.on('window-all-closed', () => {
  lockVault()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  lockVault()
})
