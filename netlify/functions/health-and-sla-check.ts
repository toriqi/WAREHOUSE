/**
 * Netlify Serverless Function: Server-Side Health & SLA Audit Verification
 * Uses server-side environment variables (never exposed to VITE_ frontend bundle).
 */
export default async (req: Request) => {
  const hasServerConfig = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'votp-request-material-serverless',
      timestamp: new Date().toISOString(),
      serverSideSupabaseConfigured: hasServerConfig,
      note: 'SAP & VOTP PDF auto-parsing remain disabled until corporate API gateway credentials are authorized.'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
