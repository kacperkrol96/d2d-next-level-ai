/** Id filmu YouTube z linku (watch?v=, youtu.be/, /embed/, /shorts/, /live/) albo samego id. */
export function youtubeIdFrom(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return valid(url.pathname.slice(1));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v) return valid(v);
      const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      return m ? valid(m[1]) : null;
    }
  } catch {
    return null;
  }
  return null;
}

const valid = (id: string) => (/^[A-Za-z0-9_-]{11}$/.test(id) ? id : null);
