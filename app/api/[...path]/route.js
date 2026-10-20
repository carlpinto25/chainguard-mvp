import { getApi } from '../../../lib/runtime.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) { return getApi()(request); }
export async function POST(request) { return getApi()(request); }
