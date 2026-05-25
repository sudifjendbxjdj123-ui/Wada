export default function OutfitCard({ result }: { result: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-3">

      <div className="flex justify-between items-center">
        <h2 className="text-xs tracking-[0.3em] text-zinc-500">
          WADA LOOK
        </h2>
        <span className="text-xs text-zinc-600">AI STYLIST</span>
      </div>

      <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
        {result}
      </div>

    </div>
  );
}