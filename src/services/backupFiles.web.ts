export async function exportBackup(contents: string) { const url = URL.createObjectURL(new Blob([contents], { type: 'application/octet-stream' })); const link = document.createElement('a'); link.href = url; link.download = `tailor-master-${Date.now()}.tmb`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function importBackup(): Promise<string | null> { return new Promise((resolve, reject) => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.tmb'; input.oncancel = () => resolve(null); input.onchange = async () => { try {
    const file = input.files?.[0];
    if (!file)
        return resolve(null);
    if (file.size > 50000000)
        throw new Error('backupInvalid');
    resolve(await file.text());
}
catch (e) {
    reject(e);
} }; input.click(); }); }

