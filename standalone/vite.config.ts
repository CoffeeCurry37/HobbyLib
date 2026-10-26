import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export default defineConfig({root:root+'standalone',plugins:[react()],publicDir:root+'public',resolve:{alias:{'@':root}},build:{outDir:root+'dist-standalone/client',emptyOutDir:true}});
