import { app, Menu } from 'electron'
import { createWindow, getMainWindow } from './window'
import { createTray } from './tray'
import { registerIpc, watchIdleLock, watchMinimizeLock } from './ipc'
import { lockVault } from './services/vault'

app.setName('Lumina')
app.setAppUserModelId('app.lumina.authenticator')

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
