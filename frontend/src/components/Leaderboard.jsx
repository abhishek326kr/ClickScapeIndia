export default function Leaderboard({ items }) {
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <div key={it.photo_id} className="p-3 rounded border border-gray-200 dark:border-gray-800 flex justify-between">
          <div>{it.title}</div>
          <div className="text-sm">Votes: {it.votes} | Jury: {it.jury_score}</div>
        </div>
      ))}
    </div>
  )
}
