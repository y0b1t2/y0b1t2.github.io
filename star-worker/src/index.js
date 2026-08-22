// はてなスター的リアクションの保存API。Cloudflare Workers + KV。
//   GET  /count?slug=/posts/xxx/            -> { count, names }
//   POST /like?slug=/posts/xxx/&name=なまえ  -> { count, names, already }
// name は任意。空なら匿名。1 IP 1 回（生IPは保存せずハッシュ化して判定）。
const MAX_NAME = 40;

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const salt = env.SALT || "change-me";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(origin) });
    }

    const slug = url.searchParams.get("slug");
    if (!slug) return json({ error: "slug required" }, 400, origin);

    const countKey = `stars:${slug}`;
    const votePrefix = `voted:${slug}:`;

    // 現在の数＋記名一覧を返す
    if (request.method === "GET" && url.pathname === "/count") {
      const count = parseInt(await env.STARS.get(countKey)) || 0;
      return json({ count, names: await namesList(env, votePrefix) }, 200, origin);
    }

    // +1 する（name があれば記名、空なら匿名）
    if (request.method === "POST" && url.pathname === "/like") {
      const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
      const voterKey = votePrefix + (await sha256(ip + salt));

      if (await env.STARS.get(voterKey)) {
        // 既に押済み → 数だけ返す
        const count = parseInt(await env.STARS.get(countKey)) || 0;
        return json({ count, names: await namesList(env, votePrefix), already: true }, 200, origin);
      }

      const name = (url.searchParams.get("name") || "").trim().slice(0, MAX_NAME);
      const count = (parseInt(await env.STARS.get(countKey)) || 0) + 1;
      await env.STARS.put(countKey, String(count));
      await env.STARS.put(voterKey, "1", {
        expirationTtl: 60 * 60 * 24 * 365, // 1年
        metadata: name ? { name, at: Date.now() } : { at: Date.now() },
      });

      const names = await namesList(env, votePrefix);
      if (name && !names.includes(name)) names.unshift(name); // 自分の名前は即反映
      return json({ count, names, already: false }, 200, origin);
    }

    return json({ error: "not found" }, 404, origin);
  },
};

// 記名者の一覧（新しい順・最大100人）。名前は KV のメタデータに持たせているので
// list 一発で取れる（各キーを get し直さない）。
async function namesList(env, votePrefix) {
  const { keys } = await env.STARS.list({ prefix: votePrefix, limit: 1000 });
  return keys
    .filter((k) => k.metadata && k.metadata.name)
    .sort((a, b) => (b.metadata.at || 0) - (a.metadata.at || 0))
    .map((k) => k.metadata.name)
    .slice(0, 100);
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
