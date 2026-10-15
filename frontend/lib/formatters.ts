export function formatDuration(seconds: number | string | undefined | null): string {
  const val = Number(seconds);
  if (!val || isNaN(val) || !isFinite(val) || val < 0) return '0:00';
  const mins = Math.floor(val / 60);
  const secs = Math.floor(val % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatBytes(bytes: number | string | undefined | null, decimals = 1): string {
  const val = Number(bytes);
  if (!val || isNaN(val) || val <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(val) / Math.log(k));
  return `${parseFloat((val / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
