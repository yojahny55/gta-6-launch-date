// CI environment setup for Workers tests
// Polyfill File API if not available (Node.js 18 undici issue)

if (typeof File === 'undefined') {
  // @ts-ignore - Polyfill for CI environment
  global.File = class File {
    constructor(
      public parts: BlobPart[],
      public name: string,
      public options?: FilePropertyBag
    ) {}
  };
}
