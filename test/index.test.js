describe('index', () => {
  test('exports Uploader', () => {
    expect(new (require('../src/index'))('https://remoteurl', 'foospace', 'foo', 'bar')).toBeInstanceOf(require('../src/upload'));
  });
});
