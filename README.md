# y0b1t2.github.io

[箱庭療法記](https://y0b1t2.github.io/) の公開用リポジトリ。Hugo + PaperMod。

## content/ は生成物です

記事の原本は private な Obsidian Vault（`y0b1t2/obsidian` の `Blog/`）にあります。
このリポジトリの `content/` は毎回まるごと作り直されるので、**直接編集しないでください**。
編集は Vault 側で行います。

## 公開の手順

Vault 側で記事を書き、`publish: true` にしてから:

```bash
# Vault で実行（書き出し → ビルド確認）
uv run scripts/blog/export_hugo.py --serve

# 問題なければこのリポジトリで
git add -A && git commit -m "posts: ..." && git push
```

push すると GitHub Actions が Hugo でビルドして Pages へ配信します。

## 構成

| 場所 | 中身 |
|---|---|
| `hugo.toml` | サイト設定。`hardWraps` は Obsidian と表示を揃えるため必須 |
| `content/` | **生成物**。Vault の `Blog/` から書き出される |
| `layouts/shortcodes/` | `amazon` / `linkcard` / `spotify`。はてなの埋め込みの置き換え |
| `assets/css/extended/` | ショートコード用のCSS。PaperMod の変数を使いライト／ダーク両対応 |
| `themes/PaperMod` | git submodule |

`youtube` は Hugo 組み込みのショートコードなので定義は不要です。

## ローカルで確認する

```bash
hugo server
```

テーマを差し替える場合は `themes/` に別のテーマを submodule で追加し、
`hugo.toml` の `theme` を変えます。`content/` は触らなくて構いません。
