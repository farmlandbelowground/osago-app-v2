// Never show a description with an external URL or a reference to the
// underlying generation service to the customer (ports osago-bundle.js:6816-6819).
export const sanitizeDocumentDescription = (
  description: string | null,
): string =>
  description && !/gamma|https?:\/\//i.test(description) ? description : ''
