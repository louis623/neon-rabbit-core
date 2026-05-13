import { NextResponse } from 'next/server'

import { getPrelaunchGateReadiness } from '@/lib/prelaunch/gate-readiness'
import { getApprovedPrelaunchQrManifest } from '@/lib/prelaunch/qr-assets'

export function GET() {
  const qrManifest = getApprovedPrelaunchQrManifest({
    baseUrl: process.env.NEXT_PUBLIC_APP_URL,
  })

  return NextResponse.json(
    {
      ok: true,
      service: 'sparkle-suite-prelaunch',
      status: 'ready',
      readiness: {
        liveActionsEnabled: false,
        qrAssets: {
          approvedFlyerPath: qrManifest.approvedFlyer.path,
          contentType: qrManifest.approvedFlyer.contentType,
          displayUrl: qrManifest.displayUrl,
          provider: qrManifest.provider,
          qrMode: qrManifest.qrMode,
          requiresExternalQrProvider: qrManifest.requiresExternalQrProvider,
          targetUrl: qrManifest.targetUrl,
        },
        gates: getPrelaunchGateReadiness(),
      },
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
