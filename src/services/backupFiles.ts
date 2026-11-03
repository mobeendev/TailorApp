import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
export async function exportBackup(contents: string) { const file = new File(Paths.cache, `tailor-master-${Date.now()}.tmb`); file.create(); await file.write(contents); if (!(await Sharing.isAvailableAsync()))
    throw new Error('shareUnavailable'); await Sharing.shareAsync(file.uri, { mimeType: 'application/octet-stream' }); }
export async function importBackup(): Promise<string | null> { const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true }); if (result.canceled)
    return null; const file = new File(result.assets[0].uri); if (file.size > 50000000)
    throw new Error('backupInvalid'); return await file.text(); }

