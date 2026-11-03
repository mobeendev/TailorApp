export async function printReceipt(html: string) { const frame = document.createElement('iframe'); frame.style.position = 'fixed'; frame.style.width = '0'; frame.style.height = '0'; frame.style.border = '0'; document.body.appendChild(frame); frame.srcdoc = html; await new Promise<void>(resolve => { frame.onload = () => resolve(); }); frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 60000); }
export async function shareReceipt(html: string) { return printReceipt(html); }

