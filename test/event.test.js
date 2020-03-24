const Event = require('../src/event');

test('toString', () => {
  const str = new Event('filename', 42, 'Message', true).toString();

  expect(str).toMatch(/filename/);
  expect(str).toMatch(/42/);
  expect(str).toMatch(/Message/);
  expect(str).toMatch(/true/);
});