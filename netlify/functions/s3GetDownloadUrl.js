import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { s3Key, fileName } = JSON.parse(event.body);
    if (!s3Key) return { statusCode: 400, body: JSON.stringify({ error: 'Missing s3Key' }) };

    // Verify this s3Key belongs to a known ProjectFile record
    const { data: files } = await supabase
      .from('project_files')
      .select('*')
      .eq('s3_key', s3Key);

    if (!files?.length) {
      return { statusCode: 403, body: JSON.stringify({ error: 'File not found or access denied' }) };
    }

    const safeFileName = (fileName || 'download').replace(/[^\w.\-]/g, '_');
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return {
      statusCode: 200,
      body: JSON.stringify({ signedUrl }),
    };
  } catch (error) {
    console.error('s3GetDownloadUrl error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
