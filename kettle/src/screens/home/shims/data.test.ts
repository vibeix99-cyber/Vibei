import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBackup } from './data';

function host(save: (req: { filename: string; data: string }) => Promise<unknown>) {
  vi.stubGlobal('window', { claude: { use: async (name: string) => (name === 'downloads' ? { save } : null) } });
}

afterEach(() => vi.unstubAllGlobals());

describe('downloadBackup through a host save prompt', () => {
  it('hands the JSON backup to the host and returns the file name', async () => {
    const save = vi.fn(async () => ({ status: 'saved' }));
    host(save);
    const name = await downloadBackup();
    expect(name).toMatch(/^kettle-backup-.*\.json$/);
    const req = (save.mock.calls[0] as unknown as [{ filename: string; data: string }])[0];
    expect(req.filename).toBe(name);
    expect(JSON.parse(req.data)).toHaveProperty('progress');
  });

  it('returns null when the person declines', async () => {
    host(async () => Promise.reject({ code: 'declined', message: 'no' }));
    await expect(downloadBackup()).resolves.toBeNull();
  });

  it('rejects on any other host failure so the screen can say so', async () => {
    host(async () => Promise.reject({ code: 'unavailable', message: 'x' }));
    await expect(downloadBackup()).rejects.toMatchObject({ code: 'unavailable' });
  });
});
