# blog-stars — はてなスター的リアクション

投稿ページの「★ + 任意の記名」ボタンの保存先。Cloudflare Workers + KV。
ブログ側（Hugo）の表示は `layouts/_partials/star.html` / `assets/js/stars.js` /
`assets/css/extended/stars.css` に入っている。ここは**保存API（バックエンド）だけ**。

```
[記事の★ボタン] --POST /like?slug=...&name=...--> [この Worker] --> [KV]
   (GitHub Pages)  <-------- { count, names } --------
```

- 記名は任意（名前欄が空なら匿名）。数は匿名＋記名の合計。
- 1 IP 1 回まで（生IPは保存せず、SALT 付きハッシュで判定）。
- 記名者は最新100人まで、名前は40文字まで表示。
- ⚠ ログイン無しの記名なので**本人確認はされない**（なりすまし可能）。

## セットアップ（初回のみ）

前提: Cloudflare の無料アカウント。このフォルダ（`star-worker/`）で作業する。

```bash
cd star-worker
npm install            # wrangler を入れる
npx wrangler login     # ブラウザが開くので許可

# KV を作成 → 出力される id を控える
npm run kv             # = wrangler kv namespace create STARS
```

1. `npm run kv` の出力に

   ```
   [[kv_namespaces]]
   binding = "STARS"
   id = "abc123..."
   ```

   と出るので、その `id` を **`wrangler.toml` の `PASTE_KV_ID_HERE`** に貼る。

2. デプロイ

   ```bash
   npm run deploy       # = wrangler deploy
   ```

   `https://blog-stars.<あなた>.workers.dev` というURLが出る。

3. そのURLを **`../hugo.toml` の `starEndpoint`** に貼る（末尾スラッシュ無し）。

   ```toml
   starEndpoint = 'https://blog-stars.xxxx.workers.dev'
   ```

4. 変更を commit して push（GitHub Actions が Pages を再ビルド）。数分後、
   各記事の本文下にスターが出る。

## 動作確認

- API 単体: ブラウザで
  `https://blog-stars.xxxx.workers.dev/count?slug=/posts/test/`
  を開き `{"count":0,"names":[]}` が返ればOK。
- 本番: 記事でボタンを押す → 数が増える → リロードしても維持 →
  名前を入れて押すとチップが出る。

## 設定（wrangler.toml の [vars]）

- `ALLOWED_ORIGIN` … 許可するオリジン。既定 `https://y0b1t2.github.io`。
  独自ドメインにしたら合わせて変更（末尾スラッシュ無し）。
- `SALT` … IPハッシュ用の塩。より安全にするなら secret に移す:

  ```bash
  npx wrangler secret put SALT     # 入力した値が [vars] より優先される
  ```

## 困ったとき

- ボタンを押しても数が変わらない → ブラウザの開発者ツール(F12)の Console に
  `blocked by CORS` が出ていないか確認。出ていたら `ALLOWED_ORIGIN` を
  サイトのオリジンと完全一致させて `npm run deploy`。
- 集計は KV の結果整合性のため、他人の画面への反映が数秒遅れることがある
  （数値自体はカウンタで正確）。
- スターを全記事から一旦消したい → `hugo.toml` の `starEndpoint = ''` に戻すだけ。
