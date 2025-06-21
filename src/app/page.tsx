import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">FLL 2025–2026 防災教育 Web アプリ</h1>
      <p className="text-center">下のリンクから各モジュールを体験できます。</p>
      <ul className="list-disc pl-6">
        <li>
          <Link href="/erosion-lab" className="text-blue-600 underline">
            川の侵食ラボ
          </Link>
        </li>
      </ul>
    </main>
  );
}
