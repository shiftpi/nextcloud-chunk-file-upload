const Upload = require('../dist/index');

if (process.argv.length !== 5) {
  console.error(`Usage: node ${process.argv[0]} <baseUrl> <user> <apiToken>`);
  process.exit(1);
}

const upload = new Upload(`${process.argv[2]}/remote.php/dav`, process.argv[3], process.argv[3], process.argv[4]);

upload.uploadFile(`${__dirname}/1MB.bin`, '/foo/bar/testupload.bin', 102400, undefined, true, true)
  .then(() => console.log('Done'))
  .catch(e => {
    console.error(e);
    console.error(e.httpErrorCode);
    console.error(e.httpErrorMessage);
    
    process.exit(2);
  });
