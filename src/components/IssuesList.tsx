import { ResumeIssue } from '@/types/resume';

const severityConfig = {
  alta: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  média: { label: 'Média', className: 'bg-yellow-100 text-yellow-700' },
  baixa: { label: 'Baixa', className: 'bg-blue-100 text-blue-700' },
};

export function IssuesList({ issues }: { issues: ResumeIssue[] }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Problemas Encontrados ({issues.length})</h2>
      <div className="space-y-3">
        {issues.map((issue, i) => {
          const config = severityConfig[issue.severity];
          return (
            <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
                  {config.label}
                </span>
                <span className="text-xs text-gray-400 capitalize">{issue.category}</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{issue.description}</p>
              <p className="text-sm text-gray-500 mt-1">💡 {issue.suggestion}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
