import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Upload from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv.length !== 5) {
    console.error(`Usage: node ${ process.argv[0] } <baseUrl> <user> <apiToken>`);
    process.exit(1);
}

const upload = new Upload(`${ process.argv[2] }/remote.php/dav`, process.argv[3], process.argv[3], process.argv[4]);

try {
    await upload.uploadFile(`${ __dirname }/1MB.bin`, '/foo/bar/testupload.bin', 102400, undefined, true, true);
    console.log('Done');
} catch (e: any) {
    console.error(e);
    console.error(e.httpErrorCode);
    console.error(e.httpErrorMessage);

    process.exit(2);
}
