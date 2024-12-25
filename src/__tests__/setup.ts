import { describe, it, expect } from '@jest/globals';

// Mock Web Crypto API
const mockSubtle = {
  importKey: jest.fn(),
  deriveKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn()
};

const mockCrypto = {
  subtle: mockSubtle,
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto
});

// Mock TextEncoder/TextDecoder
const mockTextEncoder = {
  encode: jest.fn((str) => new Uint8Array([...str].map(c => c.charCodeAt(0))))
};

const mockTextDecoder = {
  decode: jest.fn((arr) => String.fromCharCode(...arr))
};

Object.defineProperty(global, 'TextEncoder', {
  value: jest.fn(() => mockTextEncoder)
});

Object.defineProperty(global, 'TextDecoder', {
  value: jest.fn(() => mockTextDecoder)
});

// Export mocks for use in tests
export { mockSubtle, mockCrypto, mockTextEncoder, mockTextDecoder };
