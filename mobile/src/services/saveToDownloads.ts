/**
 * saveToDownloads — Saves files to the Android Downloads directory using the
 * Storage Access Framework (SAF), so they are visible in the user's file manager.
 *
 * Falls back to expo-sharing (native share sheet) if SAF is unavailable or the
 * user denies directory permission.
 *
 * On iOS, goes straight to the share sheet (no SAF equivalent).
 */

import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_URI_KEY = 'saf_downloads_uri';

/**
 * Get (or request) a SAF URI for the Downloads directory.
 * The URI is cached in AsyncStorage so the user only has to grant permission once.
 * Returns null if the user denies permission or SAF is unavailable.
 */
async function getDownloadsDirUri(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  // Check for a cached URI from a previous permission grant
  const cached = await AsyncStorage.getItem(DOWNLOADS_URI_KEY);
  if (cached) return cached;

  try {
    const downloadUri =
      FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
        downloadUri,
      );

    if (!permissions.granted) return null;

    // Persist the URI for future saves
    await AsyncStorage.setItem(DOWNLOADS_URI_KEY, permissions.directoryUri);
    return permissions.directoryUri;
  } catch (error) {
    console.error('SAF permission error:', error);
    return null;
  }
}

interface SaveResult {
  saved: boolean;
  uri: string | null;
  method: 'saf' | 'share' | 'failed';
}

/**
 * Save a text file to Downloads (Android) via SAF.
 * On iOS or if SAF fails, opens the share sheet so the user can save manually.
 */
export async function saveTextFile(
  fileName: string,
  content: string,
): Promise<SaveResult> {
  // Try SAF on Android
  if (Platform.OS === 'android') {
    try {
      const dirUri = await getDownloadsDirUri();
      if (dirUri) {
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            dirUri,
            nameWithoutExt,
            'text/plain',
          );
        await FileSystem.writeAsStringAsync(fileUri, content);
        return { saved: true, uri: fileUri, method: 'saf' };
      }
    } catch (error) {
      console.error('SAF save text error, falling back to share:', error);
      // Clear cached URI if it's no longer valid
      await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
    }
  }

  // Fallback: write to cache and offer share sheet
  return fallbackToShare(fileName, content, 'text/plain', false);
}

/**
 * Save a PDF (from a temp file URI) to Downloads (Android) via SAF.
 * On iOS or if SAF fails, opens the share sheet.
 */
export async function savePdfFile(
  tempUri: string,
  fileName: string,
): Promise<SaveResult> {
  // Try SAF on Android
  if (Platform.OS === 'android') {
    try {
      const dirUri = await getDownloadsDirUri();
      if (dirUri) {
        // Read the temp PDF as base64, then write to SAF location
        const base64Content = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            dirUri,
            nameWithoutExt,
            'application/pdf',
          );
        await FileSystem.writeAsStringAsync(fileUri, base64Content, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { saved: true, uri: fileUri, method: 'saf' };
      }
    } catch (error) {
      console.error('SAF save PDF error, falling back to share:', error);
      await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
    }
  }

  // Fallback: offer share sheet with the temp file
  return fallbackToShare(fileName, '', 'application/pdf', false, tempUri);
}

/**
 * Fallback: write content to a temp cache file and present the native share sheet.
 */
async function fallbackToShare(
  fileName: string,
  content: string,
  mimeType: string,
  isBase64: boolean,
  existingUri?: string,
): Promise<SaveResult> {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return { saved: false, uri: null, method: 'failed' };

    let uri = existingUri;

    // If we don't have an existing file, write content to cache
    if (!uri && content) {
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(cacheUri, content, isBase64 ? {
        encoding: FileSystem.EncodingType.Base64,
      } : undefined);
      uri = cacheUri;
    }

    if (!uri) return { saved: false, uri: null, method: 'failed' };

    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Guardar certificado',
    });
    return { saved: true, uri, method: 'share' };
  } catch (error) {
    console.error('Share fallback error:', error);
    return { saved: false, uri: null, method: 'failed' };
  }
}
