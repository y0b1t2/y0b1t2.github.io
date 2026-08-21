---
title: Mastodon・Blueskyの投稿・お気に入り・ブックマークを全部GitHubを経由してObsidianに送るGitHub Actionを作りました。
date: '2025-05-25T04:50:39+09:00'
slug: '2025-05-25'
draft: false
categories:
- 05_テック
---

こんにちは、よしざきです。

先日公開したMastodon・Blueskyの投稿・お気に入り・ブックマークをGitHubに送るやつ三つを一つのActionに統合しました（本記事の公開に合わせて、三つの記事・コードは非公開化済）。

「全てのSNSの投稿やお気に入りを、自動でObsidianの日記に記録できたら便利じゃない？」という発想から、Claudeに手伝ってもらって作成しました。

以下のreadmeもClaudeに作ってもらいました。コードは全部Claudeに書いてもらったので、デバッグが必要な場合はコメントで教えてください！

## 

{{< linkcard url="https://github.com/y0b1t2/Mastodon-and-Bluesky-to-Obsidian" >}}

## 🎯 このシステムでできること

BlueskyとMastodonの投稿・お気に入りを自動でObsidianに同期して、統合的なデジタル日記を作成できます。

BlueskyとMastodonのいずれか一方だけでも以下の手順で対応可能です。

### Bluesky

- 📝 投稿・リポスト・リプライ を記録
- ⭐ お気に入り を元投稿の日付で記録
- 🏷️ ハッシュタグ・リンク を完全保持

### Mastodon

- 📝 自分の投稿 を記録
- ⭐ お気に入り を投稿時刻で記録（過去24時間分）
- 🔖 ブックマーク も同様に記録
- 🏷️ ハッシュタグ を保持

### 共通機能

- 🕐 正確な日本時間 で投稿時刻を記録
- 🚀 毎朝3時に自動同期 でコンフリクトを予防
- 📝 Thinoプラグイン連携 で美しい表示
- 🔄 差分同期 で高速処理（2回目以降）
- 📁 既存ファイルに追記 で手動メモと共存

## 🚨 重要な注意点

### Blueskyの制限事項

1. リプライの表示制限
   - リプライは返信先の内容が見えません
   - 「Re」のプレフィックスのみで表示（返信先は見えません）
2. 引用リポスト非対応
   - 引用リポストは取得できません
   - 通常のリポストのみ対応

### Mastodonの制限事項

1. お気に入り・ブックマークの取得制限
   - 投稿時刻が24時間以内のもののみ取得
   - 古い投稿のお気に入りは記録されません
2. API制限
   - 最大40件まで取得可能

## 🛠️ 必要なもの

### 必須ツール・アカウント

- ☐ Obsidian がインストール済み
- ☐ Thinoプラグイン がインストール済み
- ☐ Obsidian Git プラグイン がインストール済み
- ☐ GitHubアカウント を持っている
- ☐ Blueskyアカウント または Mastodonアカウント（両方でもOK）

### 事前知識不要

プログラミング経験は必要ありません。説明に従って設定すれば動作します。

## 📋 設定手順（全8ステップ）

### ステップ1: GitHubリポジトリの準備

#### 1-1. GitHubでプライベートリポジトリを作成

1. GitHub.comにログイン
2. 「+」ボタン → <strong>「New repository」</strong>をクリック
3. リポジトリ設定:

   ```
   Repository name: obsidian-social-sync
   Description: Bluesky and Mastodon posts sync to Obsidian
   ✅ Private（重要！投稿内容を保護）
   ✅ Add a README file
   ```
4. <strong>「Create repository」</strong>をクリック

#### 1-2. Obsidian Git プラグインでリポジトリを連携

1. Obsidianを開く
2. Settings → Community plugins → Obsidian Git
3. リポジトリクローン:
   - リポジトリURL: <https://github.com/>[あなたのユーザー名]/obsidian-social-sync
   - ローカルディレクトリを選択
4. 認証設定: GitHubのユーザー名・パスワード（またはPersonal Access Token）を入力

### ステップ2: Thinoでの保存先設定

#### 2-1. 保存先ディレクトリの作成

1. Obsidianで新しいフォルダーを作成
2. 推奨ディレクトリ名: Thino

   ```
   📁 Vault Root/
   └── 📁 Thino/           ← ここに投稿が保存される
       ├── 2025-01-15.md
       ├── 2025-01-16.md
       └── ...
   ```

### ステップ3: GitHub Personal Access Token の作成

#### 3-1. GitHubでPATを作成

1. GitHub右上のプロフィール画像 → Settings
2. 左下の「Developer settings」
3. 「Personal access tokens」 → 「Tokens (classic)」
4. 「Generate new token (classic)」

#### 3-2. トークン設定

```
Note: Social Media Obsidian Sync
Expiration: 1 year（任意に設定可能）

必要な権限（スコープ）:
✅ repo (Full control of private repositories)
✅ workflow (Update GitHub Action workflows)
```

#### 3-3. トークンを保存

1. <strong>「Generate token」</strong>をクリック
2. トークンをコピー（ghp_で始まる）
3. 安全な場所にメモ保存（一度しか表示されません）

### ステップ4: GitHub Secrets の設定

#### 4-1. Secrets設定画面へ

1. GitHubリポジトリページを開く
2. 「Settings」タブをクリック
3. 左サイドバー「Secrets and variables」 → 「Actions」

#### 4-2. 必要なSecretsを追加

##### 共通（必須）

```
Name: GITHUB_TOKEN
Secret: [ステップ3で取得したPersonal Access Token]
```

##### Bluesky用（Blueskyを使う場合）

```
Name: BLUESKY_HANDLE
Secret: [あなたのBlueskyハンドル（例：user.bsky.social）]

Name: BLUESKY_PASSWORD
Secret: [BlueskyのApp Password]
```

App Password作成方法:

1. Bluesky → 設定 → プライバシーとセキュリティ
2. App Passwords → 新しいApp Passwordを作成

##### Mastodon用（Mastodonを使う場合）

```
Name: MASTODON_INSTANCE_URL
Secret: [あなたのインスタンスURL（例：https://mastodon.social）]

Name: MASTODON_ACCESS_TOKEN
Secret: [Mastodonのアクセストークン]
```

アクセストークン作成方法:

1. Mastodon → 設定 → 開発
2. 新規アプリ → 名前「Obsidian Sync」で作成
3. 必要な権限: read:accounts, read:statuses, read:favourites, read:bookmarks

### ステップ5: GitHub Actions ワークフローファイルの作成

#### 5-1. GitHub上で直接作成

1. GitHubリポジトリページを開く
2. 「Add file」ボタン → <strong>「Create new file」</strong>をクリック
3. ファイル名を入力: .github/workflows/unified-social-sync.yml

#### 5-2. 重要：カスタマイズが必要な箇所

以下の箇所を、ステップ2で決めた保存先に変更してください:

yaml

```
# 74行目付近
- name: Create Thino directory
  run: |
    mkdir -p Thino  # ← あなたの保存先フォルダ名に変更

# 728行目付近
- name: Commit and push changes
  run: |
    git add Thino/  # ← あなたの保存先フォルダ名に変更
```

例：日記フォルダーに保存する場合

yaml

```
mkdir -p Daily/Social
git add Daily/Social/
```

#### 5-3. ファイルの保存

1. カスタマイズが完了したら
2. 「Commit new file」ボタンをクリック
3. コミットメッセージ: Setup unified social sync workflow
4. <strong>「Commit new file」</strong>をクリックして確定

### ステップ6: 初回実行とテスト

#### 6-1. GitHub Actionsで手動実行

1. GitHubリポジトリ → 「Actions」タブ
2. <strong>「Unified Social Media to Obsidian Sync」</strong>を選択
3. 「Run workflow」ボタンをクリック
4. Force full sync: falseのまま実行

#### 6-2. 実行ログの確認

成功すると以下のようなログが表示されます：

```
🚀 統合ソーシャルメディア同期を開始します...
⏰ 実行開始時刻: 2025-01-15 12:00:00 JST

=== Mastodon同期 ===
✅ Mastodon投稿取得完了: 5件
✅ お気に入り取得完了: 3/10件が対象
✅ ブックマーク取得完了: 2/5件が対象

=== Bluesky同期 ===
✅ Blueskyログイン成功
✅ Blueskyアクティビティ取得完了: 8件
✅ Blueskyライク取得完了: 12件

🎉 統合同期完了！
```

### ステップ7: Obsidianでの確認と運用開始

#### 7-1. 最新データの取得

1. Obsidian Git で最新データをプル
   - Ctrl+P（Cmd+P） → "Git: Pull"

#### 7-2. 生成ファイルの確認

markdown

```
# 2025年01月15日

- 18:00 今日は良い一日でした #日記 #via_bluesky
- 17:30 ⭐️alice 参考になる記事です #tech #via_bluesky_fav
- 15:30 Mastodonからの投稿テスト #test #via_mastodon
- 14:00 RP @bob.bsky.social 面白い視点ですね #via_bluesky
- 12:00 ⭐️charlie@mastodon.social 勉強になりました #via_mastodon_fav
- 10:00 🔖eve@mastodon.social 後で読む記事 #via_mastodon_bookmark
```

#### 7-3. 自動同期の確認

- 毎朝3時: 自動実行される（日本時間）
- 差分取得: 2回目以降は新規分のみ（高速）

## 🔧 トラブルシューティング

### Bluesky関連

「401 Unauthorized」エラー

- App Passwordを再生成してGitHub Secretsを更新
- ハンドル名に@を含めていないか確認

### Mastodon関連

お気に入りが取得されない

- 24時間以内の投稿のみが対象です
- アクセストークンの権限を確認

### 共通

ファイルが作成されない

- ワークフローファイルの保存先ディレクトリ名を確認
- Thinoフォルダが正しく作成されているか確認

「403 Forbidden」エラー

- GitHub Personal Access Tokenの権限を確認
- repoとworkflow権限が必要

## 🎊 完了！

### 達成したこと

- ✅ BlueskyとMastodonの統合同期
- ✅ 投稿・お気に入り・ブックマークの自動記録
- ✅ 正確な日本時間での記録
- ✅ ハッシュタグの完全保持
- ✅ 効率的な差分同期

### これからできること

1. 統合ライフログ: 複数SNSの活動を一箇所で管理
2. クロスプラットフォーム分析: どのSNSでどんな話題に興味を持ったか
3. ハッシュタグ検索: SNS横断での話題追跡
4. 知識の連携: SNS投稿からObsidianノートへのリンク

このシステムで、分散していたSNS活動が一つの価値あるデジタル日記に統合されます。複数のプラットフォームでの思考や発見が、Obsidianという一つの場所に集約され、新しい知識管理体験が始まります！
