import type { Request, Response } from 'express';

/**
 * Health check endpoint for LTA DataMall proxy service
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  // Allow basic CORS headers for serverless execution
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const hasApiKey = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY
  );

  return res.status(200).json({
    status: 'ok',
    service: 'lta-datamall-serverless-api',
    timestamp: new Date().toISOString(),
    accountKeyConfigured: hasApiKey,
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=:busStopCode[&ServiceNo=:serviceNo]',
      health: '/api/health',
    },
  });
}
