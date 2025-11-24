import type { QuizData } from "../types/quiz";

type QuizContextProps = {
  quizData: QuizData;
};

export default function QuizContext({ quizData }: QuizContextProps) {
  // Extract fixture data from metadata
  const fixture = quizData.metadata?.fixture as {
    home_team?: string;
    away_team?: string;
    teams?: {
      home?: { name?: string };
      away?: { name?: string };
    };
    fixture?: {
      date?: string;
    };
    date?: string;
    score?: string;
    status?: string;
    id?: string | number;
    [key: string]: unknown;
  } | undefined;

  const league = quizData.metadata?.league as {
    name?: string;
    id?: string | number;
  } | undefined;

  // Extract team names - handle both flat and nested structures
  const homeTeam = fixture?.home_team || fixture?.teams?.home?.name;
  const awayTeam = fixture?.away_team || fixture?.teams?.away?.name;
  const fixtureDate = fixture?.date || fixture?.fixture?.date;

  // Don't show context if no fixture data
  if (!fixture || (!homeTeam && !awayTeam)) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-US')}`;
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const formattedDate = formatDate(fixtureDate);

  return (
    <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/60 p-5 mb-6 shadow-lg shadow-slate-900/50">
      <div className="text-center space-y-3">
        {league?.name && (
          <div className="text-xs uppercase tracking-wider text-emerald-400/80 font-semibold">
            {league.name}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 text-xl font-bold text-slate-100">
          <span className="text-right min-w-0 flex-1 ">{homeTeam}</span>
          <span className="text-slate-500 text-base font-normal shrink-0">vs</span>
          <span className="text-left min-w-0 flex-1 ">{awayTeam}</span>
        </div>

        {fixture.score && fixture.status === 'finished' && (
          <div className="text-emerald-400 font-bold text-2xl tracking-wider">
            {fixture.score}
          </div>
        )}

        {formattedDate && (
          <div className="text-xs text-slate-400/90 pt-1 border-t border-slate-700/50">
            {formattedDate}
          </div>
        )}
      </div>
    </div>
  );
}
