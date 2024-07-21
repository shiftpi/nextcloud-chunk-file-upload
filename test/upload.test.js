const Upload = require('../src/upload');

jest.mock('fs');
jest.mock('axios');

describe('upload', () => {
  beforeEach(() => {
    require('fs').reset();
    require('axios').reset();
  });

  test('upload successfully', () => {
    require('axios').__mkcolPaths = ['/'];

    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 1)
      .then(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeTruthy();
      });
  });

  test('read from stream fails', () => {
    require('fs').__failing = true;
    require('axios').__mkcolPaths = ['/'];

    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 1)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(0);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(0);
        expect(e.complete).toBeFalsy();
      });
  });

  test('mkcol fails', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'mkcol';
    require('axios').__mkcolPaths = ['/'];
    require('axios').__failingUrl = '/';

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 1)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(0);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBeNull();
        expect(e.complete).toBeFalsy();
      });
  });

  test('put fails, retries also fail', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'put';
    require('axios').__mkcolPaths = ['/'];

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 3)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(0);
        expect(e.complete).toBeFalsy();
      });
  });

  test('put fails, retries also fail with delete chunks', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'put';
    require('axios').__mkcolPaths = ['/'];

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 3, false, true)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(1);

        expect(e.chunkNo).toBe(0);
        expect(e.complete).toBeFalsy();
      });
  });

  test('put fails, retries pass', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'put';
    require('axios').__retriesTillPass = 2;
    require('axios').__mkcolPaths = ['/'];

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 3)
      .then(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(7);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeTruthy();
      });
  });

  test('move fails', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'move';
    require('axios').__mkcolPaths = ['/'];

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 3)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeFalsy();
      });
  });

  test('move fails with delete chunks', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__failingMethod = 'move';
    require('axios').__mkcolPaths = ['/'];

    return uploader.uploadFile('/foobar.jpg', '/baz.jpg', 100, 3, false, true)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(1);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(1);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeFalsy();
      });
  });

  test('create sub directories successfully', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__mkcolPaths = ['/', '/foo', '/foo/bar'];

    return uploader.uploadFile('/foobar.jpg', '/foo/bar/baz.jpg', 100, 1, true)
      .then(e => {
        expect(require('axios').__mkcolCnt).toBe(3);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeTruthy();
      });
  });

  test('create sub directory exists', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__mkcolPaths = ['/', '/foo', '/foo/bar'];
    require('axios').__failingMethod = 'mkcol';
    require('axios').__failingUrl = '/foo';
    require('axios').__rejectData = {
      response: {
        data: '<somecontent><s:message>The resource you tried to create already exists</s:message></somecontent>'
      }
    };

    return uploader.uploadFile('/foobar.jpg', '/foo/bar/baz.jpg', 100, 1, true)
      .then(e => {
        expect(require('axios').__mkcolCnt).toBe(3);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(1);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBe(4);
        expect(e.complete).toBeTruthy();
      });
  });
  
  test('create sub directories fails', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__mkcolPaths = ['/', '/foo'];
    require('axios').__failingMethod = 'mkcol';
    require('axios').__failingUrl = '/foo';

    return uploader.uploadFile('/foobar.jpg', '/foo/bar/baz.jpg', 100, 1, true)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(2);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(0);

        expect(e.chunkNo).toBeNull();
        expect(e.complete).toBeFalsy();
      });
  });

  test('create sub directories fails with delete chunks', () => {
    const uploader = new Upload('https://remoteurl', 'foospace', 'foo', 'bar');

    require('axios').__mkcolPaths = ['/', '/foo'];
    require('axios').__failingMethod = 'mkcol';
    require('axios').__failingUrl = '/foo';

    return uploader.uploadFile('/foobar.jpg', '/foo/bar/baz.jpg', 100, 1, true, true)
      .then(() => expect(true).toBeFalsy())
      .catch(e => {
        expect(require('axios').__mkcolCnt).toBe(2);
        expect(require('axios').__putCnt).toBe(4);
        expect(require('axios').__moveCnt).toBe(0);
        expect(require('axios').__deleteCnt).toBe(1);

        expect(e.chunkNo).toBeNull();
        expect(e.complete).toBeFalsy();
      });
  });
});
