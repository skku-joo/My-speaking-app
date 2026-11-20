import { generateSpeakingFeedback, type FeedbackRequest } from '../server/feedback';

interface VercelLikeRequest {
  method?: string;
  body?: unknown;
}

interface VercelLikeResponse {
  status: (code: number) => VercelLikeResponse;
  json: (payload: unknown) => void;
  end: (body?: string) => void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const feedbackReq = (rawBody || {}) as FeedbackRequest;
    const result = await generateSpeakingFeedback(feedbackReq);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Vercel /api/feedback handler error:', error);
    return res.status(400).json({ error: 'Invalid request body' });
  }
}
