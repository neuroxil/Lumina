import { Menu, Tray, app, nativeImage } from 'electron'
import { join } from 'path'
import { getMainWindow } from './window'
import { lockVault } from './services/vault'

let tray: Tray | null = null

export function createTray(): void {
  if (tray) return
  const icon = nativeImage.createFromPath(join(app.getAppPath(), 'build/icon.png')).resize({
    width: 16,
    height: 16
  })
  tray = new Tray(icon)
  tray.setToolTip('Lumina')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Lumina',
        click: () => {
          const win = getMainWindow()
          win?.show()
          win?.focus()
        }
      },
      {
        label: 'Lock',
        click: () => {
          lockVault()
          getMainWindow()?.webContents.send('vault:locked')
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
  tray.on('click', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isVisible()) win.focus()
    else win.show()
  })
}
