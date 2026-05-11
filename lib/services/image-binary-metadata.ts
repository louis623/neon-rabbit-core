export interface ImageBinaryMetadata {
  contentType: 'image/png' | 'image/jpeg' | 'image/webp'
  width: number
  height: number
}

export class ImageBinaryMetadataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageBinaryMetadataError'
  }
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]

export function extractImageBinaryMetadata(
  bytes: Uint8Array,
): ImageBinaryMetadata | null {
  if (hasPrefix(bytes, PNG_SIGNATURE)) {
    return parsePngMetadata(bytes)
  }

  if (isJpeg(bytes)) {
    return parseJpegMetadata(bytes)
  }

  if (hasPrefix(bytes, RIFF_SIGNATURE) && hasAsciiAt(bytes, 8, WEBP_SIGNATURE)) {
    return parseWebpMetadata(bytes)
  }

  return null
}

function parsePngMetadata(bytes: Uint8Array): ImageBinaryMetadata {
  if (bytes.length < 24) {
    throw new ImageBinaryMetadataError('PNG metadata is truncated or corrupt')
  }

  const ihdrLength = readUint32BE(bytes, 8)
  const chunkType = readAscii(bytes, 12, 4)

  if (ihdrLength !== 13 || chunkType !== 'IHDR') {
    throw new ImageBinaryMetadataError('PNG metadata is truncated or corrupt')
  }

  return {
    contentType: 'image/png',
    width: readDimension(readUint32BE(bytes, 16), 'PNG'),
    height: readDimension(readUint32BE(bytes, 20), 'PNG'),
  }
}

function parseJpegMetadata(bytes: Uint8Array): ImageBinaryMetadata {
  let offset = 2

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new ImageBinaryMetadataError('JPEG metadata is truncated or corrupt')
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1
    }

    if (offset >= bytes.length) {
      throw new ImageBinaryMetadataError('JPEG metadata is truncated or corrupt')
    }

    const marker = bytes[offset]
    offset += 1

    if (marker === 0xd9) {
      break
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue
    }

    if (offset + 1 >= bytes.length) {
      throw new ImageBinaryMetadataError('JPEG metadata is truncated or corrupt')
    }

    const segmentLength = readUint16BE(bytes, offset)
    if (segmentLength < 2) {
      throw new ImageBinaryMetadataError('JPEG metadata is truncated or corrupt')
    }

    if (isStartOfFrameMarker(marker)) {
      if (segmentLength < 7 || offset + segmentLength > bytes.length) {
        throw new ImageBinaryMetadataError('JPEG metadata is truncated or corrupt')
      }

      return {
        contentType: 'image/jpeg',
        width: readDimension(readUint16BE(bytes, offset + 5), 'JPEG'),
        height: readDimension(readUint16BE(bytes, offset + 3), 'JPEG'),
      }
    }

    offset += segmentLength
  }

  throw new ImageBinaryMetadataError('JPEG metadata is missing or corrupt')
}

function parseWebpMetadata(bytes: Uint8Array): ImageBinaryMetadata {
  if (bytes.length < 16) {
    throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
  }

  const chunkType = readAscii(bytes, 12, 4)

  if (chunkType === 'VP8X') {
    if (bytes.length < 30) {
      throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
    }

    const width = readUint24LE(bytes, 24) + 1
    const height = readUint24LE(bytes, 27) + 1

    return {
      contentType: 'image/webp',
      width: readDimension(width, 'WEBP'),
      height: readDimension(height, 'WEBP'),
    }
  }

  if (chunkType === 'VP8 ') {
    if (bytes.length < 30) {
      throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
    }

    if (
      bytes[23] !== 0x9d ||
      bytes[24] !== 0x01 ||
      bytes[25] !== 0x2a
    ) {
      throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
    }

    const width = readUint16LE(bytes, 26) & 0x3fff
    const height = readUint16LE(bytes, 28) & 0x3fff

    return {
      contentType: 'image/webp',
      width: readDimension(width, 'WEBP'),
      height: readDimension(height, 'WEBP'),
    }
  }

  if (chunkType === 'VP8L') {
    if (bytes.length < 25) {
      throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
    }

    if (bytes[20] !== 0x2f) {
      throw new ImageBinaryMetadataError('WEBP metadata is truncated or corrupt')
    }

    const width = 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8))
    const height =
      1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10))

    return {
      contentType: 'image/webp',
      width: readDimension(width, 'WEBP'),
      height: readDimension(height, 'WEBP'),
    }
  }

  throw new ImageBinaryMetadataError('WEBP container is unsupported or corrupt')
}

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) {
    return false
  }

  return prefix.every((value, index) => bytes[index] === value)
}

function hasAsciiAt(bytes: Uint8Array, offset: number, ascii: number[]): boolean {
  if (bytes.length < offset + ascii.length) {
    return false
  }

  return ascii.every((value, index) => bytes[offset + index] === value)
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8
}

function isStartOfFrameMarker(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  )
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) {
    throw new ImageBinaryMetadataError('Image metadata is truncated or corrupt')
  }

  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  if (bytes.length < offset + 2) {
    throw new ImageBinaryMetadataError('Image metadata is truncated or corrupt')
  }

  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  if (bytes.length < offset + 2) {
    throw new ImageBinaryMetadataError('Image metadata is truncated or corrupt')
  }

  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  if (bytes.length < offset + 3) {
    throw new ImageBinaryMetadataError('Image metadata is truncated or corrupt')
  }

  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  if (bytes.length < offset + 4) {
    throw new ImageBinaryMetadataError('Image metadata is truncated or corrupt')
  }

  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  )
}

function readDimension(value: number, format: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ImageBinaryMetadataError(`${format} metadata is truncated or corrupt`)
  }

  return value
}
