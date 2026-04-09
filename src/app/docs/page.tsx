"use client";

import Script from "next/script";
import { useRef, useCallback } from "react";

const SWAGGER_UI_VERSION = "5.17.14";
const SWAGGER_UI_CSS = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
const SWAGGER_UI_JS = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;

interface SwaggerUIBundleType {
  (config: Record<string, unknown>): unknown;
  presets: {
    apis: unknown;
  };
}

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleType;
  }
}

export default function DocsPage() {
  const initialized = useRef(false);

  const initSwagger = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    const SwaggerUIBundle = window.SwaggerUIBundle;
    if (typeof SwaggerUIBundle !== "function") return;

    SwaggerUIBundle({
      url: "/api/docs",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
    });
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={SWAGGER_UI_CSS} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; background: #fafafa; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin: 30px 0; }
          `,
        }}
      />
      <div id="swagger-ui" />
      <Script src={SWAGGER_UI_JS} strategy="afterInteractive" onLoad={initSwagger} />
    </>
  );
}
