import { NextRequest, NextResponse } from "next/server";
import { isProxyableGoogleHost } from "@/lib/google-proxy-hosts";
import { checkRateLimit } from "@/lib/rate-limit";

const FORWARD_REQUEST_HEADERS = [
  "content-type",
  "authorization",
  "x-firebase-client",
  "x-client-version",
  "x-goog-api-client",
];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Firebase-Client, X-Client-Version, X-Goog-Api-Client",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest) {
  const rate = checkRateLimit(request, "google-proxy");
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const host = request.nextUrl.searchParams.get("host");
  const path = request.nextUrl.searchParams.get("path");

  if (!host || !path || !isProxyableGoogleHost(host)) {
    return NextResponse.json({ error: "Invalid proxy target" }, { status: 400 });
  }

  const targetUrl = `https://${host}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers();
  FORWARD_REQUEST_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const responseHeaders = new Headers(corsHeaders(request.headers.get("origin")));

    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proxy request failed" },
      { status: 502, headers: corsHeaders(request.headers.get("origin")) }
    );
  }
}
