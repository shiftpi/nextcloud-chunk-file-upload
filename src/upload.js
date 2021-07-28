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

  uploadStream(stream, remotePath, retryChunks = 5) {
    return new Promise((async (resolve, reject) => {
      const chunkPath = `${this.#uploadUrl}/${remotePath.replace(/^\/+/, '')}-${crypto.randomBytes(16).toString('hex')}`;

      await axios.request({
        method: 'mkcol',
        url: chunkPath,
        auth: this.#auth
      }).catch(() => reject(new Event(undefined, null, 'Failed creating remote directory')));

      let readable = false;
      let chunkNo = 0;

      stream.on('readable', async () => {
        // Make sure the upload happens only one time. The event is triggered twice: The first time when the stream is
        // ready for reading and the second when the end of the stream has been reached.
        if (readable) {
          return;
        }

        readable = true;

        let chunk;

        while ((chunk = stream.read())) {
          // TODO: padStart
          const offsetIdentifier = ('' + chunkNo).padStart(10, '0');

          let success = false;

          for (let i = 0; i <= retryChunks && !success; i++) {
            success = await axios.request({
              method: 'put',
              url: `${chunkPath}/${offsetIdentifier}`,
              auth: this.#auth,
              data: chunk
            }).then(() => true)
              .catch(() => false);
          }

          if (!success) {
            return reject(new Event(undefined, chunkNo, 'Failed uploading chunk, max retries reached'));
          }

          chunkNo++;
        }

        await axios.request({
          method: 'move',
          url: `${chunkPath}/.file`,
          auth: this.#auth,
          headers: {
            Destination: `${this.#filesUrl}/${remotePath.replace(/^\/+/, '')}`
          }
        }).then(() => resolve(new Event(undefined, chunkNo, null, true)))
          .catch(() => reject(new Event(undefined, chunkNo, 'Failed to glue the chunks together')));
      }).on('error', () => {
        reject(new Event(undefined, chunkNo, 'Failed reading from the stream'));
      });
    }));
  }

  uploadFile(localPath, remotePath, chunkSize = 2 * 1024 * 1024, retryChunks) {
    const stream = fs.createReadStream(localPath, {highWaterMark: chunkSize});

    return this.uploadStream(stream, remotePath, retryChunks)
      .then(event => {
        event.filename = localPath;
        return event;
      })
      .catch(event => {
        event.filename = localPath;
        return event;
      });
  }
}

module.exports = Upload;
