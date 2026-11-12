import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { attachmentHeader } from './files'
import type { FileStorage } from './storage'

export type S3StorageOptions = {
  bucket: string
  region: string
  presignExpiresSeconds: number
}

export class S3Storage implements FileStorage {
  private readonly client: S3Client

  constructor(private readonly opts: S3StorageOptions, client?: S3Client) {
    this.client = client ?? new S3Client({ region: opts.region })
  }

  async save(key: string, data: Buffer) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        Body: data,
        ContentLength: data.length,
        ContentType: 'application/pdf',
      }),
    )
  }

  async read(key: string) {
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: this.opts.bucket, Key: key }),
    )
    if (!out.Body) throw new Error(`S3 object has no body: ${key}`)
    return Buffer.from(await out.Body.transformToByteArray())
  }

  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.opts.bucket, Key: key }))
  }

  presignedDownloadUrl(key: string, fileName: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.opts.bucket,
        Key: key,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: attachmentHeader(fileName),
      }),
      { expiresIn: this.opts.presignExpiresSeconds },
    )
  }

  async ping() {
    await this.client.send(new HeadBucketCommand({ Bucket: this.opts.bucket }))
  }
}
