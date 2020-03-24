const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const Event = require('./event');

class Upload {
  #uploadUrl;
  #filesUrl;
  #auth;

  constructor(url, userspace, username, password) {
    this.#uploadUrl = `${url.replace(/\/+$/, '')}/uploads/${userspace}`;
    this.#filesUrl = `${url.replace(/\/+$/, '')}/files/${userspace}`;
    this.#auth = {
      username: username,
      password: password
    };
  }

  uploadFile(localPath, remotePath, chunkSize = 2 * 1024 * 1024, retryChunks = 5) {
    return new Promise((async (resolve, reject) => {
      const chunkPath = `${this.#uploadUrl}/${remotePath.replace(/^\/+/, '')}-${crypto.randomBytes(16).toString('hex')}`;

      await axios({
        method: 'mkcol',
        url: chunkPath,
        auth: this.#auth
      }).catch(() => new Event(localPath, null, 'Failed creating directory'));

      const identifierLength = ('' + fs.statSync(localPath)['size']).length;

      const stream = fs.createReadStream(localPath, {highWaterMark: chunkSize});
      let chunkNo = 0;
      let chunkOffset = 0;
      let readable = false;

      stream.on('readable', async () => {
        // Make sure the upload happens only one time. The event is triggered twice: The first time when the stream is
        // ready for reading and the second when the end of the stream has been reached.
        if (readable) {
          return;
        }

        readable = true;

        let chunk;

        while ((chunk = stream.read())) {
          const offsetIdentifier = ('' + chunkOffset).padStart(identifierLength, '0');
          chunkOffset += chunk.length - 1;
          const limitIdentifier = ('' + chunkOffset).padStart(identifierLength, '0');
          chunkOffset++;

          let success = false;

          for (let i = 0; i < retryChunks && !success; i++) {
            success = await axios.put(`${chunkPath}/${offsetIdentifier}-${limitIdentifier}`, chunk, {
              auth: this.#auth
            }).then(() => true)
              .catch(() => false);
          }

          if (!success) {
            return reject(new Event(localPath, chunkNo, 'Failed uploading chunk, max retries reached'));
          }

          chunkNo++;
        }

        await axios({
          method: 'move',
          url: `${chunkPath}/.file`,
          auth: this.#auth,
          headers: {
            Destination: `${this.#filesUrl}/${remotePath.replace(/^\/+/, '')}`
          }
        }).then(() => resolve(new Event(localPath, chunkNo, null, true)))
          .catch(() => reject(new Event(localPath, chunkNo, 'Failed to glue the chunks together')));
      }).on('error', () => {
        reject(new Event(localPath, chunkNo, 'Failed reading the local file'));
      });
    }));
  }
}

module.exports = Upload;
