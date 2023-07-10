let axios = jest.createMockFromModule('axios');

axios.reset = () => {
  axios.__failingMethod = null;
  axios.__mkcolPaths = [];
  axios.__failingUrl = null;
  axios.__rejectData = undefined;
  axios.__retriesTillPass = Number.MAX_VALUE;
  axios.__mkcolCnt = 0;
  axios.__putCnt = 0;
  axios.__moveCnt = 0;
};

axios.request = config => {
  const isMkcol = config.method.match(/^mkcol$/i)
    && (
      config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}$/i) && axios.__mkcolPaths.includes('/')
      || config.url === 'https://remoteurl/files/foospace/foo' && axios.__mkcolPaths.includes('/foo')
      || config.url === 'https://remoteurl/files/foospace/foo/bar' && axios.__mkcolPaths.includes('/foo/bar')
    );
  
  const isPut = config.method.match(/^put$/i) && config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}\/\d{3}-\d{3}$/i);
  
  const isMove = config.method.match(/^move$/i) && config.url.startsWith('https://remoteurl/uploads/foospace') && config.url.endsWith('.file');
  
  const isMkcolFail = axios.__failingMethod === 'mkcol' && config.method.match(/^mkcol$/i) && (
    config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}$/i) && axios.__failingUrl === '/'
    || config.url === 'https://remoteurl/files/foospace/foo' && axios.__failingUrl === '/foo'
    || config.url === 'https://remoteurl/files/foospace/foo/bar' && axios.__failingUrl === '/foo/bar'
  );
  
  if (config.auth.username !== 'foo' || config.auth.password !== 'bar') {
    throw new Error('Invalid credentials');
  }
  
  axios[`__${config.method.toLowerCase()}Cnt`]++;
  
  if (isMkcol || isPut || isMove) {
    return (isMkcolFail
    || (axios.__failingMethod !== 'mkcol' && axios.__failingMethod === config.method.toLowerCase() && axios.__retriesTillPass + 1 >= axios[`__${config.method.toLowerCase()}Cnt`]))
      ? Promise.reject(axios.__rejectData) : Promise.resolve();
  } else {
    throw new Error(`Unexpected request: ${config.method} ${config.url}`);
  }
};

axios.reset();

module.exports = axios;
