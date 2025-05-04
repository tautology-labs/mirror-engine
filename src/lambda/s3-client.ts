import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || '445307590870-mirror-engine-logs';

const s3 = new S3Client({ region: REGION });

export async function uploadToS3(
  key: string,
  body: string,
  contentType = 'application/json'
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);
  console.log(`✅ Uploaded to S3: s3://${BUCKET_NAME}/${key}`);
}

export function resolveS3KeyInputLog(model: string, tone: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // e.g. "2025-05-04"
    const epochMs = now.getTime(); // e.g. 1714868234567
  
    return `experiments/${datePart}/${model}.${tone}.${epochMs}.input.json`;
  }

export function resolveS3KeyInput(model: string, tone: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10); // e.g. "2025-05-04"
    const epochMs = now.getTime(); // e.g. 1714868234567
  
    return `experiments/${datePart}/${model}.${tone}.${epochMs}.input.json`;
  }
  
  export function resolveS3KeyOutput(model: string, tone: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const epochMs = now.getTime();
  
    return `experiments/${datePart}/${model}.${tone}.${epochMs}.output.json`;
  }
  