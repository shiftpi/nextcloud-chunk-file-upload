# Nextcloud Chunk Upload
Upload files to Nextcloud using chunks

Nextcloud offers a chunked upload library, which makes your life a lot easier, if you want to upload large files to
your Nextcloud instance over a bad network.

Use this library if you want to build some sort of upload client in node.js and do that with the joy of Promises (👌).


## Installation
This package is published on NPM so you can simply type:
```
npm install --save nextcloud-chunk-upload
```

## Usage
The core part of this library is a class called `Upload`, which takes care of server parameters, like the server's address and
your credentials. If you want to start an upload, ``uploadFile`` with additional parameters relating to the upload file.
The return value of this method is Promise, indicating the success or failure of the upload process.

### Upload
###

### Event
tbd

### Example
A simple upload code could look like this:
```javascript
const Upload = require('nextcloud-chunk-upload');

const upload = new Upload('https://example..com/remote.php/dav', 'myuser', 'myspace', 'secret');

upload.uploadFile('/path/to/localfile.jpg', '/path/to/remotefile.jpg')
  .then(event => {
    console.log('Success!');
    console.log(event.toString());
  })
  .catch(event => {
    console.error('Sth. went wrong')
    console.error(event.toString());
  });
```

## License
This project is licensed under the MIT license. See LICENSE file.