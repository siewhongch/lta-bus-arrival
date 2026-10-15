import type { Request, Response } from 'express';

/**
 * Serverless endpoint for fetching LTA DataMall v3 Bus Arrival timings
 * GET /api/busarrival?BusStopCode=83139[&ServiceNo=65]
 *
 * Headers required by LTA DataMall:
 * AccountKey: <LTA_ACCOUNT_KEY>
 * accept: application/json
 */
export default async function handler(req: Request, res: Response) {
  // CORS configuration for serverless deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract BusStopCode and optional ServiceNo from query
  const busStopCode = (req.query.BusStopCode || req.query.busStopCode || req.query.busstopcode) as string;
  const serviceNo = (req.query.ServiceNo || req.query.serviceNo || req.query.serviceno) as string;

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required query parameter: BusStopCode (e.g. ?BusStopCode=83139)',
    });
  }

  // Retrieve AccountKey from environment variables (no hardcoded keys)
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY;

  if (!accountKey) {
    return res.status(503).json({
      error: 'AccountKey Not Configured',
      message:
        'LTA_ACCOUNT_KEY environment variable is not set. Configure your LTA DataMall AccountKey in .env or environment secrets to retrieve live data.',
      busStopCode,
      fallbackMode: true,
    });
  }

  try {
    // Construct LTA DataMall v3 endpoint URL
    let ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(
      busStopCode
    )}`;

    if (serviceNo) {
      ltaUrl += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }

    const ltaResponse = await fetch(ltaUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      return res.status(ltaResponse.status).json({
        error: 'LTA DataMall Error',
        status: ltaResponse.status,
        statusText: ltaResponse.statusText,
        upstreamMessage: errorText,
      });
    }

    const data = await ltaResponse.json();

    // Cache control: cache for 15 seconds to match LTA DataMall update frequency
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Failed to fetch arrival data from LTA DataMall',
    });
  }
}
