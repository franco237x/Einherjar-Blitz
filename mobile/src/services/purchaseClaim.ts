/**
 * PurchaseClaim — Generates a PDF certificate for a store purchase,
 * SAVES it to the device (Downloads on Android, app documents on iOS),
 * and then offers the native share sheet.
 *
 * The file is always saved locally BEFORE the caller deletes Firestore
 * records, ensuring the user never loses their certificate.
 */

import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { PurchaseRecord } from '@/constants/storeData';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Save a file URI to the device's Downloads / media library (Android). */
async function saveToDownloads(fileUri: string): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.Asset.create(fileUri);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('saveToDownloads failed:', e);
    return false;
  }
}

/** Offer the native share sheet for an already-saved file. */
async function offerShare(uri: string, dialogTitle: string): Promise<void> {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle,
      });
    }
  } catch {
    // User cancelled or share failed — file is already saved, no problem.
  }
}

// ─── Single purchase certificate ──────────────────────────────────────────

/**
 * Generate a PDF certificate for a single purchase.
 * Returns an object with the saved file URI and whether it was saved to Downloads.
 */
export async function claimPurchasePDF(
  purchase: PurchaseRecord
): Promise<{ uri: string; savedToDownloads: boolean }> {
  const dateStr = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const purchaseDate = purchase.purchasedAt
    ? purchase.purchasedAt.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; padding: 40px; color: #1a1a2e; background: #fafafa; }
          .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px; }
          .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
          .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .label { color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .value { color: #1a1a2e; font-size: 16px; font-weight: bold; }
          .price { color: #d4af37; font-size: 22px; font-weight: bold; }
          .badge { display: inline-block; background: #d4af37; color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 11px; letter-spacing: 1px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; }
          .seal { text-align: center; margin-top: 20px; }
          .seal-icon { font-size: 40px; color: #d4af37; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EINHERJAR BLITZ</h1>
          <div class="subtitle">Certificado de Compra · Tienda Oficial</div>
        </div>

        <p style="color: #666; font-size: 14px;">Reclamado el ${dateStr}</p>

        <div class="card">
          <div class="label">Producto</div>
          <div class="value">${purchase.productName}</div>

          <div style="margin-top: 16px;">
            <div class="label">Precio Pagado</div>
            <div class="price">${purchase.price.toLocaleString()} Esferas</div>
          </div>

          <div style="margin-top: 16px;">
            <div class="label">Fecha de Compra</div>
            <div class="value">${purchaseDate}</div>
          </div>

          <div class="seal">
            <div class="seal-icon">&#9733;</div>
            <div class="badge">COMPRA VERIFICADA</div>
          </div>
        </div>

        <div class="footer">
          Este certificado confirma la compra realizada en la tienda oficial de Einherjar Blitz.
          Conserve este documento como comprobante de su adquisición.
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return { uri: '', savedToDownloads: false };
    }

    // 1. Generate PDF to temp cache
    const { uri: tempUri } = await Print.printToFileAsync({ html });

    // 2. Copy to persistent app document directory
    const timestamp = Date.now();
    const persistentFile = new File(Paths.document, `einherjar-compra-${timestamp}.pdf`);
    const tempFile = new File(tempUri);
    tempFile.copy(persistentFile, { overwrite: true });

    // 3. Save to Downloads (Android) — direct, no folder picker
    const savedToDownloads = await saveToDownloads(persistentFile.uri);

    // 4. Offer share sheet (optional — file is already saved)
    await offerShare(
      persistentFile.uri,
      `Certificado de compra: ${purchase.productName}`
    );

    return { uri: persistentFile.uri, savedToDownloads };
  } catch (error) {
    console.error('Error generating purchase PDF:', error);
    throw error;
  }
}

// ─── Bulk purchase certificate ────────────────────────────────────────────

/**
 * Generate a single PDF with ALL purchases (bulk claim certificate).
 * Returns an object with the saved file URI and whether it was saved to Downloads.
 */
export async function claimAllPurchasesPDF(
  purchases: PurchaseRecord[]
): Promise<{ uri: string; savedToDownloads: boolean }> {
  if (purchases.length === 0) return { uri: '', savedToDownloads: false };

  const dateStr = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = purchases
    .map((p, i) => {
      const purchaseDate = p.purchasedAt
        ? p.purchasedAt.toLocaleDateString('es-ES')
        : 'N/A';
      return `
      <tr>
        <td>${i + 1}</td>
        <td>${p.productName}</td>
        <td style="color: #d4af37; font-weight: bold;">${p.price.toLocaleString()}</td>
        <td>${purchaseDate}</td>
      </tr>
    `;
    })
    .join('');

  const totalEsferas = purchases.reduce((sum, p) => sum + p.price, 0);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; padding: 40px; color: #1a1a2e; background: #fafafa; }
          .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px; }
          .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          th, td { border: 1px solid #eee; padding: 12px; text-align: left; font-size: 13px; }
          th { background: #f8f8f8; color: #d4af37; font-weight: bold; }
          .total { text-align: right; margin-top: 16px; font-size: 18px; color: #d4af37; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EINHERJAR BLITZ</h1>
          <div class="subtitle">Certificado de Compras · ${purchases.length} productos</div>
        </div>
        <p style="color: #666; font-size: 14px;">Reclamado el ${dateStr}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Esferas</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="total">Total: ${totalEsferas.toLocaleString()} Esferas</div>
        <div class="footer">
          Este certificado confirma todas las compras realizadas en la tienda oficial de Einherjar Blitz.
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return { uri: '', savedToDownloads: false };
    }

    // 1. Generate PDF to temp cache
    const { uri: tempUri } = await Print.printToFileAsync({ html });

    // 2. Copy to persistent app document directory
    const timestamp = Date.now();
    const persistentFile = new File(Paths.document, `einherjar-compras-${timestamp}.pdf`);
    const tempFile = new File(tempUri);
    tempFile.copy(persistentFile, { overwrite: true });

    // 3. Save to Downloads (Android)
    const savedToDownloads = await saveToDownloads(persistentFile.uri);

    // 4. Offer share sheet
    await offerShare(
      persistentFile.uri,
      `Certificado de compras (${purchases.length} productos)`
    );

    return { uri: persistentFile.uri, savedToDownloads };
  } catch (error) {
    console.error('Error generating bulk purchase PDF:', error);
    throw error;
  }
}
