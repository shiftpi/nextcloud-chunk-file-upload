const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
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
  
  #createDir(remotePath) {
    return axios.request({
      method: 'mkcol',
      url: remotePath,
      auth: this.#auth
    });
  }
  
  #createDirsRecursively(remotePath) {
    return new Promise((async (resolve, reject) => {
      // Remove root path from list of dirs to check
      const dirs = remotePath.split('/').filter(path => !!path);
      
      if (!dirs.length) {
        return resolve();
      }
      
      let currentPath = '';
      
      for (let dir of dirs) {
        currentPath += `/${dir}`;
        
        try {
          await this.#createDir(`${this.#filesUrl}${currentPath}`);
        } catch (e) {
          if (!e?.response?.data || !e.response.data.includes('<s:message>The resource you tried to create already exists</s:message>')) {
            return reject(e);
          }
        }
      }
      
      resolve();
    }));
  }
  
  async #deleteChunks(chunkPath) {
    try {
      await axios.request({
        method: 'delete',
        url: chunkPath,
        auth: this.#auth
      });
    } catch (e) {
      // Ignore delete errors
    }
  }

  uploadFile(localPath, remotePath, chunkSize = 2 * 1024 * 1024, retryChunks = 5, createDirsRecursively = false, deleteChunksOnFailure = false) {
    return new Promise((async (resolve, reject) => {
      const chunkPath = `${this.#uploadUrl}/${crypto.randomBytes(32).toString('hex')}`;
      
      try {
        await this.#createDir(chunkPath);
      } catch (e) {
        return reject(new Event(localPath, null, 'Failed creating temporary upload directory', false, e?.response));
      }
      
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
          let lastHttpErrorEvent;
          
          for (let i = 0; i <= retryChunks && !success; i++) {
            try {
              await axios.request({
                method: 'put',
                url: `${chunkPath}/${offsetIdentifier}-${limitIdentifier}`,
                auth: this.#auth,
                data: chunk
              });

              success = true;
            } catch (e) {
              lastHttpErrorEvent = e;
              success = false;
            }
          }
          
          if (!success) {
            if (deleteChunksOnFailure) {
              await this.#deleteChunks(chunkPath);
            }
            
            return reject(new Event(localPath, chunkNo, 'Failed uploading chunk, max retries reached', false, lastHttpErrorEvent?.response));
          }
          
          chunkNo++;
        }
        
        if (createDirsRecursively) {
          const remoteDir = path.dirname(remotePath);
          
          try {
            await this.#createDirsRecursively(remoteDir);
          } catch (e) {
            if (deleteChunksOnFailure) {
              await this.#deleteChunks(chunkPath);
            }
            
            return reject(new Event(localPath, null, `Failed creating remote directory ${remoteDir}`, false, e?.response));
          }
        }
        
        try {
          await axios.request({
            method: 'move',
            url: `${chunkPath}/.file`,
            auth: this.#auth,
            headers: {
              Destination: `${this.#filesUrl}/${remotePath.replace(/^\/+/, '')}`
            }
          });
          
          resolve(new Event(localPath, chunkNo, null, true));
        } catch (e) {
          if (deleteChunksOnFailure) {
            await this.#deleteChunks(chunkPath);
          }
          
          return reject(new Event(localPath, chunkNo, 'Failed to glue the chunks together', false, e?.response));
        }
      }).on('error', () => {
        reject(new Event(localPath, chunkNo, 'Failed reading the local file'));
      });
    }));
  }
}

module.exports = Upload;
