import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
export async function printReceipt(html: string) { await Print.printAsync({ html }); }
export async function shareReceipt(html: string) {
    if (!(await Sharing.isAvailableAsync())) throw new Error('shareUnavailable');
    // Expo Go's print output can live outside the experience's readable directory.
    // Write the rendered PDF into this app's cache before granting share access.
    const rendered = await Print.printToFileAsync({ html, base64: true });
    if (!rendered.base64) throw new Error('printFailed');
    const file = new File(Paths.cache, `receipt-${randomUUID()}.pdf`);
    file.create();
    await file.write(rendered.base64, { encoding: 'base64' });
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: '.pdf' });
}

