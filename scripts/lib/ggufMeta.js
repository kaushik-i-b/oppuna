/**
 * Lightweight GGUF header / KV reader for release verification.
 * Streams only the metadata section — never loads tensor weights into memory.
 */

const fs = require('fs');

const GGUF_MAGIC = Buffer.from('GGUF', 'ascii');

const VALUE_TYPE = {
  UINT8: 0,
  INT8: 1,
  UINT16: 2,
  INT16: 3,
  UINT32: 4,
  INT32: 5,
  FLOAT32: 6,
  BOOL: 7,
  STRING: 8,
  ARRAY: 9,
  UINT64: 10,
  INT64: 11,
  FLOAT64: 12,
};

function readExact(fd, size, position) {
  const buf = Buffer.alloc(size);
  const read = fs.readSync(fd, buf, 0, size, position);
  if (read !== size) {
    throw new Error(`Short read at offset ${position} (wanted ${size}, got ${read})`);
  }
  return buf;
}

class GgufReader {
  constructor(fd) {
    this.fd = fd;
    this.pos = 0;
  }

  read(size) {
    const buf = readExact(this.fd, size, this.pos);
    this.pos += size;
    return buf;
  }

  readU32() {
    return this.read(4).readUInt32LE(0);
  }

  readU64() {
    const buf = this.read(8);
    // Safe for typical GGUF counts (< 2^53).
    return Number(buf.readBigUInt64LE(0));
  }

  readString() {
    const len = this.readU64();
    if (len < 0 || len > 50_000_000) {
      throw new Error(`Unreasonable GGUF string length: ${len}`);
    }
    return this.read(len).toString('utf8');
  }

  skipValue(type) {
    switch (type) {
      case VALUE_TYPE.UINT8:
      case VALUE_TYPE.INT8:
      case VALUE_TYPE.BOOL:
        this.pos += 1;
        return;
      case VALUE_TYPE.UINT16:
      case VALUE_TYPE.INT16:
        this.pos += 2;
        return;
      case VALUE_TYPE.UINT32:
      case VALUE_TYPE.INT32:
      case VALUE_TYPE.FLOAT32:
        this.pos += 4;
        return;
      case VALUE_TYPE.UINT64:
      case VALUE_TYPE.INT64:
      case VALUE_TYPE.FLOAT64:
        this.pos += 8;
        return;
      case VALUE_TYPE.STRING: {
        const len = this.readU64();
        this.pos += len;
        return;
      }
      case VALUE_TYPE.ARRAY: {
        const elemType = this.readU32();
        const n = this.readU64();
        for (let i = 0; i < n; i += 1) this.skipValue(elemType);
        return;
      }
      default:
        throw new Error(`Unknown GGUF value type ${type}`);
    }
  }

  readValue(type) {
    switch (type) {
      case VALUE_TYPE.UINT8:
        return this.read(1).readUInt8(0);
      case VALUE_TYPE.INT8:
        return this.read(1).readInt8(0);
      case VALUE_TYPE.UINT16:
        return this.read(2).readUInt16LE(0);
      case VALUE_TYPE.INT16:
        return this.read(2).readInt16LE(0);
      case VALUE_TYPE.UINT32:
        return this.read(4).readUInt32LE(0);
      case VALUE_TYPE.INT32:
        return this.read(4).readInt32LE(0);
      case VALUE_TYPE.FLOAT32:
        return this.read(4).readFloatLE(0);
      case VALUE_TYPE.BOOL:
        return this.read(1).readUInt8(0) !== 0;
      case VALUE_TYPE.STRING:
        return this.readString();
      case VALUE_TYPE.UINT64:
        return Number(this.read(8).readBigUInt64LE(0));
      case VALUE_TYPE.INT64:
        return Number(this.read(8).readBigInt64LE(0));
      case VALUE_TYPE.FLOAT64:
        return this.read(8).readDoubleLE(0);
      case VALUE_TYPE.ARRAY: {
        const elemType = this.readU32();
        const n = this.readU64();
        // Only materialize small string arrays used in metadata.
        if (elemType === VALUE_TYPE.STRING && n <= 64) {
          const values = [];
          for (let i = 0; i < n; i += 1) values.push(this.readString());
          return values;
        }
        for (let i = 0; i < n; i += 1) this.skipValue(elemType);
        return null;
      }
      default:
        throw new Error(`Unknown GGUF value type ${type}`);
    }
  }
}

/**
 * @param {string} filePath
 * @param {string[]} [keys]
 * @returns {{ magicOk: boolean, version: number|null, architecture: string|null, name: string|null, basename: string|null, finetune: string|null, sizeLabel: string|null, license: string|null, chatTemplatePreview: string|null, kv: Record<string, unknown> }}
 */
function readGgufIdentity(filePath, keys = []) {
  const interesting = new Set([
    'general.architecture',
    'general.name',
    'general.basename',
    'general.finetune',
    'general.size_label',
    'general.license',
    'tokenizer.chat_template',
    ...keys,
  ]);

  const fd = fs.openSync(filePath, 'r');
  try {
    const reader = new GgufReader(fd);
    const magic = reader.read(4);
    const magicOk = magic.equals(GGUF_MAGIC);
    if (!magicOk) {
      return {
        magicOk: false,
        version: null,
        architecture: null,
        name: null,
        basename: null,
        finetune: null,
        sizeLabel: null,
        license: null,
        chatTemplatePreview: null,
        kv: {},
      };
    }

    const version = reader.readU32();
    reader.readU64(); // tensor_count
    const kvCount = reader.readU64();
    const kv = {};

    for (let i = 0; i < kvCount; i += 1) {
      const key = reader.readString();
      const type = reader.readU32();
      if (interesting.has(key)) {
        let value = reader.readValue(type);
        if (typeof value === 'string' && value.length > 240) {
          value = `${value.slice(0, 240)}…`;
        }
        kv[key] = value;
      } else {
        reader.skipValue(type);
      }
    }

    const chatTemplate = kv['tokenizer.chat_template'];
    return {
      magicOk: true,
      version,
      architecture: typeof kv['general.architecture'] === 'string' ? kv['general.architecture'] : null,
      name: typeof kv['general.name'] === 'string' ? kv['general.name'] : null,
      basename: typeof kv['general.basename'] === 'string' ? kv['general.basename'] : null,
      finetune: typeof kv['general.finetune'] === 'string' ? kv['general.finetune'] : null,
      sizeLabel: typeof kv['general.size_label'] === 'string' ? kv['general.size_label'] : null,
      license: typeof kv['general.license'] === 'string' ? kv['general.license'] : null,
      chatTemplatePreview: typeof chatTemplate === 'string' ? chatTemplate : null,
      kv,
    };
  } finally {
    fs.closeSync(fd);
  }
}

function checkGgufMagic(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    return buf.equals(GGUF_MAGIC);
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = {
  GGUF_MAGIC,
  readGgufIdentity,
  checkGgufMagic,
};
