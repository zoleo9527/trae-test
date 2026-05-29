const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

export const openNewWindow = async (url, title, width = 1000, height = 700) => {
  if (ipcRenderer) {
    return ipcRenderer.invoke('open-new-window', { url, title, width, height })
  }
  window.open(url, '_blank', `width=${width},height=${height}`)
  return null
}

export const printContent = async (content) => {
  if (ipcRenderer) {
    return ipcRenderer.invoke('print-content', content)
  }
  const printWindow = window.open('', '_blank')
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.print()
  printWindow.close()
  return true
}

export const showSaveDialog = async (options) => {
  if (ipcRenderer) {
    return ipcRenderer.invoke('show-save-dialog', options)
  }
  return { canceled: true }
}
