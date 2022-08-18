const Event = require('../src/event');

describe('event', () => {
  test('toString with message', () => {
    const str = new Event('filename', 42, 'Foo bar baz', true).toString();

    expect(str).toMatch(/filename/);
    expect(str).toMatch(/42/);
    expect(str).toMatch(/Foo bar baz/);
    expect(str).toMatch(/true/);
  });

  test('toString without message', () => {
    const str = new Event('filename', 42, undefined, true).toString();

    expect(str).toMatch(/filename/);
    expect(str).toMatch(/42/);
    expect(str).toMatch(/No message/);
    expect(str).toMatch(/true/);
  });
  
  test('construct with HTTP response', () => {
    const httpResponse = '<?xml version="1.0" encoding="utf-8"?>\n<message>Hello world</message>\n';
    const event = new Event('filename', 42, undefined, true, {
      status: 500,
      data: httpResponse
    });

    expect(event.httpErrorCode).toBe(500);
    expect(event.httpErrorMessage).toBe(httpResponse);
    expect(event.toString()).not.toMatch(/500/);
    expect(event.toString()).not.toMatch(/xml/);
  });
  
  test('construct without HTTP response', () => {
    const httpResponse = '<?xml version="1.0" encoding="utf-8"?>\n<message>Hello world</message>\n';
    const event = new Event('filename', 42, undefined, true);

    expect(event.httpErrorCode).toBeNull();
    expect(event.httpErrorMessage).toBeNull();
  });
});
