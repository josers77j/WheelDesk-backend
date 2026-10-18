const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeSpan } = require('./telemetry-dev.cjs');

test('keeps timing metadata and removes sensitive attributes and errors', () => {
  const span = {
    attributes: {
      'db.system': 'postgresql',
      'db.statement': 'private SQL',
      'http.url': 'private URL',
      'aws.s3.key': 'private file',
      'http.status_code': 200,
    },
    events: [{ name: 'exception', attributes: { message: 'private' } }],
    status: { code: 2, message: 'private' },
  };
  sanitizeSpan(span);
  assert.deepEqual(span.attributes, {
    'db.system': 'postgresql',
    'http.status_code': 200,
  });
  assert.deepEqual(span.events, []);
  assert.deepEqual(span.status, { code: 2 });
});
