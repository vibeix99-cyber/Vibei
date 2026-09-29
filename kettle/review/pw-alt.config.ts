/** Same as playwright.config.ts but against an already-running server on ALT_PORT (no webServer). Local use only. */
import base from './playwright.config';
const port = Number(process.env.ALT_PORT ?? 5192);
export default { ...base, workers: 2, webServer: undefined, use: { ...base.use, baseURL: `http://127.0.0.1:${port}` } };
