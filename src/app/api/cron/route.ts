import type { NextRequest } from 'next/server';
import env from '../../../../env';

export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  console.log('CRON JOB EXECUTED 🕺🕺');
  return Response.json({ success: true });
}
