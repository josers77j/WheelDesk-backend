const allowedAttributes = new Set([
  'http.method',
  'http.request.method',
  'http.status_code',
  'http.response.status_code',
  'db.system',
  'db.system.name',
  'db.operation',
  'db.operation.name',
  'rpc.system',
  'rpc.service',
  'rpc.method',
  'aws.service',
  'aws.operation',
]);

// Retain timing and operation metadata without SQL, URLs or document data.
function sanitizeSpan(span) {
  for (const key of Object.keys(span.attributes)) {
    if (!allowedAttributes.has(key)) delete span.attributes[key];
  }
  if (span.attributes['db.system'] || span.attributes['db.system.name']) {
    span.name = 'postgresql.query';
  }
  span.events.splice(0);
  delete span.status.message;
}

module.exports = { sanitizeSpan };

if (
  process.env.OTEL_DEV_ENABLED === '1' &&
  process.env.NODE_ENV?.toLowerCase() !== 'production'
) {
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const {
    OTLPTraceExporter,
  } = require('@opentelemetry/exporter-trace-otlp-http');
  const {
    BatchSpanProcessor,
    AlwaysOnSampler,
  } = require('@opentelemetry/sdk-trace-base');
  const { resourceFromAttributes } = require('@opentelemetry/resources');
  const {
    HttpInstrumentation,
  } = require('@opentelemetry/instrumentation-http');
  const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
  const {
    AwsInstrumentation,
  } = require('@opentelemetry/instrumentation-aws-sdk');
  const sanitizer = {
    onStart() {},
    onEnd: sanitizeSpan,
    forceFlush: async () => {},
    shutdown: async () => {},
  };
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ 'service.name': 'tire-workshop-backend-dev' }),
    sampler: new AlwaysOnSampler(),
    spanProcessors: [
      sanitizer,
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: 'http://127.0.0.1:4318/v1/traces',
          timeoutMillis: 3000,
        }),
        { maxQueueSize: 32768, maxExportBatchSize: 512 },
      ),
    ],
    instrumentations: [
      new HttpInstrumentation({ ignoreOutgoingRequestHook: () => true }),
      new PgInstrumentation({ enhancedDatabaseReporting: false }),
      new AwsInstrumentation({ suppressInternalInstrumentation: true }),
    ],
  });
  sdk.start();
  process.once('SIGTERM', () => {
    void sdk.shutdown().catch(() => {});
  });
  process.once('SIGINT', () => {
    void sdk.shutdown().catch(() => {});
  });
}
