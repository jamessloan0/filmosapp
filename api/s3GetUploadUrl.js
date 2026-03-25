import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

const FREE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
const PRO_LIMIT_BYTES  = 20 * 1024 * 1024 * 1024;
const FREE_EXPIRY_DAYS = 3;
const PRO_EXPIRY_DAYS  = 14;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) return res.status(401).json({ error: 'Unauthorized' });

    const { data: users } = await supabase.from('users').select('*').eq('email', authUser.email);
    const user = users?.[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { fileName, fileType, fileSize, projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_email', user.email);
    if (!projects?.length) return res.status(403).json({ error: 'Project not found or access denied' });

    const isPro = user.plan === 'pro';
    const sizeLimit = isPro ? PRO_LIMIT_BYTES : FREE_LIMIT_BYTES;
    if (fileSize > sizeLimit) {
      const limitLabel = isPro ? '20 GB' : '2 GB';
      return res.status(400).json({ error: `File exceeds the ${isPro ? 'Pro' : 'Free'} plan limit of ${limitLabel}.` });
    }

    const expiryDays = isPro ? PRO_EXPIRY_DAYS : FREE_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `filmos/projects/${projectId}/${Date.now()}-${safeFileName}`;
    const bucket = process.env.AWS_S3_BUCKET;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const fileUrl = `https://d1uwhxuquz3bk7.cloudfront.net/${key}`;

    return res.status(200).json({ uploadUrl, fileUrl, expiresAt, key });
  } catch (error) {
    console.error('s3GetUploadUrl error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
