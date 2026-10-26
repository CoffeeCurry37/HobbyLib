import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export default defineConfig({resolve:{alias:{'@':root}},ssr:{noExternal:['zod']},build:{ssr:root+'standalone/server.ts',outDir:root+'dist-standalone/server',emptyOutDir:true,target:'node24',rollupOptions:{output:{entryFileNames:'server.mjs'}}}});
