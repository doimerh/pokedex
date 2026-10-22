// server.ts
// Servidor para Deno Deploy: sirve la app Angular ya compilada
// (carpeta dist/pokedex-angular) y agrega los encabezados de seguridad.

const ROOT = "dist/pokedex-angular";

// ---------------------------------------------------------------
// Encabezados de seguridad
// ---------------------------------------------------------------
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // Angular puede dejar un onload="this.media='all'" en el index.html.
  // Se permite solo ese texto exacto, mediante su hash.
  "script-src-attr 'unsafe-hashes' 'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self' https://pokeapi.co https://beta.pokeapi.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Content-Security-Policy": CSP,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

// ---------------------------------------------------------------
// Tipos de archivo
// ---------------------------------------------------------------
const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  webmanifest: "application/manifest+json",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
  map: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
};

function contentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

// ---------------------------------------------------------------
// Lectura de archivos
// ---------------------------------------------------------------
async function readStatic(pathname: string): Promise<Response | null> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const parts = decoded.split("/").filter((p) => p !== "" && p !== ".");
  // Evita salirse de la carpeta de la app (ej: /../../etc/passwd)
  if (parts.some((p) => p === ".." || p.includes("\0") || p.includes("\\"))) {
    return null;
  }

  let filePath = `${ROOT}/${parts.join("/")}`;
  try {
    const info = await Deno.stat(filePath);
    if (info.isDirectory) filePath = `${filePath}/index.html`;
    const file = await Deno.open(filePath, { read: true });
    const headers = new Headers({ "Content-Type": contentType(filePath) });
    // Los archivos con hash en el nombre no cambian: se pueden guardar mucho tiempo.
    if (/\.[0-9a-f]{16,}\.(js|css)$/.test(filePath)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (filePath.endsWith(".html")) {
      headers.set("Cache-Control", "no-cache");
    } else {
      headers.set("Cache-Control", "public, max-age=3600");
    }
    return new Response(file.readable, { headers });
  } catch {
    return null;
  }
}

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

// ---------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return withSecurityHeaders(
      new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      }),
    );
  }

  const { pathname } = new URL(req.url);
  let res = await readStatic(pathname);

  // Modo SPA: rutas de Angular sin extension (/about, /pokemon/25...)
  // devuelven index.html para que Angular las resuelva.
  if (!res) {
    const last = pathname.split("/").pop() ?? "";
    if (!last.includes(".")) {
      res = await readStatic("/index.html");
    }
  }

  return withSecurityHeaders(
    res ?? new Response("Not Found", { status: 404 }),
  );
});
