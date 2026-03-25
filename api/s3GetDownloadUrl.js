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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { s3Key, fileName } = req.body;
    if (!s3Key) return res.status(400).json({ error: 'Missing s3Key' });

    const { data: files } = await supabase
      .from('project_files')
      .select('*')
      .eq('s3_key', s3Key);

    if (!files?.length) {
      return res.status(403).json({ error: 'File not found or access denied' });
    }

    const safeFileName = (fileName || 'download').replace(/[^\w.\-]/g, '_');
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return res.status(200).json({ signedUrl });
  } catch (error) {
    console.error('s3GetDownloadUrl error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
