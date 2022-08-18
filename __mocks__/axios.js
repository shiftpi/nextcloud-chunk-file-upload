let axios = jest.genMockFromModule('axios');

axios.reset = () => {
  axios.__failingMethod = null;
  axios.__retriesTillPass = Number.MAX_VALUE;
  axios.__mkcolCnt = 0;
  axios.__putCnt = 0;
  axios.__moveCnt = 0;
};

axios.request = config => {
  if (config.auth.username !== 'foo' || config.auth.password !== 'bar') {
    fail(new Error('Invalid credentials'));
  }

  axios[`__${config.method.toLowerCase()}Cnt`]++;

  if (
    (config.method.match(/^mkcol$/i)
      && config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}$/i))
    || (config.method.match(/^put$/i)
      && config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}\/\d{3}-\d{3}$/i))
    || (config.method.match(/^move$/i)
      && config.url.match(/^https:\/\/remoteurl\/uploads\/foospace\/[0-9a-f]{64}\/\.file$/i)
      && config.headers.Destination === 'https://remoteurl/files/foospace/foo/bar/baz.jpg')
  ) {
    return axios.__failingMethod === config.method.toLowerCase() && axios.__retriesTillPass + 1 >= axios[`__${config.method.toLowerCase()}Cnt`]
      ? Promise.reject() : Promise.resolve();
  } else {
    throw new Error('Unexpected request');
  }
};

axios.reset();

module.exports = axios;
