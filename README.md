# FLL 2025–2026 防災教育 Web アプリ

https://mirai-stack-app.vercel.app/

**Next.js 15 + React 19 + TypeScript** を用いて、小学生～中学生向けに「川の侵食 → 水害 → ハザードマップ理解 → 3D 可視化・体験」を一つの流れで学べるモジュール群を提供する教育用 Web アプリケーションです。

---

## 🎯 プロジェクト概要

- **目的**

  - 河川の侵食メカニズムから水害発生までを体験的に学習
  - 紙のハザードマップでは分かりにくい「浸水の深さ・範囲」を直感的に理解
  - Minecraft 風 3D 環境と連携し、楽しみながら防災・地理リテラシーを向上

- **対象**

  - 小学校高学年～中学生（10～15 歳程度）
  - 教室ワークショップ、校外学習、家庭での自主学習での利用を想定

- **主な学びのステップ**
  1. **川の侵食ラボ**：仮想地形上で水流実験。雨量や浸透、堆積に加え地形の傾斜を反映した侵食アルゴリズムを採用。初期状態から中央に波状の川が流れ、滑らかに川底が削られていく様子を観察しやすく
  2. **洪水ハザードシミュレーター**：現実データを元に 3D 街を再現 → 洪水体験
  3. **ハザードマップ探検隊**：地図読みクエスト → 安全な避難場所・ルートを探索

---

## 📦 技術スタック

- フレームワーク：Next.js 15 (App Router)
- UI：React 19 + TypeScript
- スタイリング：Tailwind CSS
- 3D 表示：three.js（または Babylon.js）
- データ可視化：Recharts or D3.js
- データ連携：GIS オープンデータ（国土交通省 PLATEAU など）
- （発展）Minecraft 連携：Education Edition の Code Connection / サーバープラグイン

---

## 🚀 セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-org/fll-hazard-app.git
cd fll-hazard-app

# 依存関係をインストール
npm install

# ローカル開発サーバー起動
npm run dev
# ブラウザで http://localhost:3000 を開く
```

## 📝 注意点

- `presentation/components/ui` 配下は shadcn/ui のプリミティブのまま運用してください
- 新規 UI 部品は `src/presentation/components/` 以下に追加して再利用を徹底してください
