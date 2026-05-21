"use client";

import { useEffect } from "react";
import { toProxiedGoogleUrl } from "@/lib/google-proxy-hosts";

/**
 * Routes Firebase SDK calls to Google APIs through same-origin /api/proxy/google
 * so corporate firewalls that block identitytoolkit.googleapis.com still work.
 */
export function FetchProxyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const OriginalXHR = window.XMLHttpRequest;

    function patchXhrOpen(xhr: XMLHttpRequest) {
      const originalOpen = xhr.open.bind(xhr);
      xhr.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        const urlString = typeof url === "string" ? url : url.href;
        const proxied = toProxiedGoogleUrl(urlString);
        if (proxied) {
          return originalOpen(method, proxied, async ?? true, username, password);
        }
        return originalOpen(method, url, async ?? true, username, password);
      };
    }

    window.XMLHttpRequest = function (this: XMLHttpRequest) {
      const xhr = new OriginalXHR();
      patchXhrOpen(xhr);
      return xhr;
    } as unknown as typeof XMLHttpRequest;
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      const proxied = toProxiedGoogleUrl(url);
      if (proxied) {
        if (input instanceof Request) {
          return originalFetch(
            new Request(proxied, {
              method: input.method,
              headers: input.headers,
              body: input.body,
              credentials: input.credentials,
              mode: "cors",
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity,
            }),
            init
          );
        }
        return originalFetch(proxied, init);
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
      window.XMLHttpRequest = OriginalXHR;
    };
  }, []);

  return <>{children}</>;
}
