/**
 * fileExport — Browser replacements for the native file helpers of the
 * mobile app (SAF / share sheet / expo-print).
 *
 * - downloadTextFile: triggers a real file download via a Blob URL.
 * - printHtml: renders an HTML document in a hidden iframe and opens the
 *   browser print dialog, where the user can pick "Guardar como PDF".
 *
 * Browsers never report whether a print was saved or cancelled, so callers
 * must ask the user before treating a printed certificate as saved.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printHtml(html: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => setTimeout(() => iframe.remove(), 500);

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        reject(new Error('No se pudo abrir el diálogo de impresión.'));
        return;
      }
      win.document.title = title;
      win.focus();
      // print() blocks until the dialog closes in every major browser.
      win.print();
      cleanup();
      resolve();
    };
    iframe.srcdoc = html;
  });
}
