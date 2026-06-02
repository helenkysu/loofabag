export async function uploadFileDirect(
  loofaId: string,
  file: File,
  type: string = 'photos',
): Promise<string | null> {
  const params = new URLSearchParams({ loofa_id: loofaId, filename: file.name, type });
  const presignRes = await fetch(`/api/upload/presign?${params}`);
  if (!presignRes.ok) return null;
  const { signedUrl, path } = await presignRes.json() as { signedUrl?: string; path?: string };
  if (!signedUrl || !path) return null;

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  return uploadRes.ok ? path : null;
}
