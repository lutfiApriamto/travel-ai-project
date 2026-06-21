// Trigger download file dari Blob response (e.g. PDF e-tiket, CSV laporan).
// Gunakan dengan axios responseType: 'blob'.
export const downloadBlob = (blob, filename) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
