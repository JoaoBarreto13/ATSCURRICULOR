interface ScoreCardProps {
  score: number;
  feedback: string;
}

export function ScoreCard({ score, feedback }: ScoreCardProps) {
  const color =
    score >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
    score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                  'text-red-600 bg-red-50 border-red-200';

  const label =
    score >= 80 ? 'Excelente para ATS' :
    score >= 60 ? 'Moderado — melhorias necessárias' :
                  'Baixo — currículo precisa de revisão';

  return (
    <div className={`p-6 rounded-xl border ${color}`}>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-black">{score}</div>
        <div>
          <div className="text-lg font-semibold">{label}</div>
          <div className="text-sm mt-1 opacity-80">{feedback}</div>
        </div>
      </div>
      <div className="mt-4 bg-white/60 rounded-full h-3">
        <div
          className="h-3 rounded-full bg-current transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
