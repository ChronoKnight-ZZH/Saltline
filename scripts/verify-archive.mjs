import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("archive/manifest.json", root), "utf8"),
);
const { path, bytes, sha256 } = manifest.originalFile;
const original = await readFile(new URL(path, root));
const actual = createHash("sha256").update(original).digest("hex");

if (original.length !== bytes || actual !== sha256) {
  throw new Error(`Archive verification failed: ${path} (${actual})`);
}

console.log(`Verified original Saltline ${manifest.publishedVersion}`);
console.log(`${original.length} bytes; SHA-256 ${actual}`);

const fontManifest = JSON.parse(
  await readFile(new URL("archive/font-manifest.json", root), "utf8"),
);
await Promise.all(
  fontManifest.fonts.map(async (font) => {
    const data = await readFile(new URL(font.path, root));
    const hash = createHash("sha256").update(data).digest("hex");
    if (data.length !== font.bytes || hash !== font.sha256) {
      throw new Error(`Font verification failed: ${font.path}`);
    }
  }),
);
console.log(`Verified ${fontManifest.fonts.length} local font files`);
