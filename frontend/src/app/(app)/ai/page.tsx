'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ResourceStatusBadge } from '@/components/status-badge';
import type { AiAnswer } from '@/types';

const SUGGESTIONS = [
  'Who is available next month?',
  'Who has AWS skills?',
  'Who is overallocated?',
  'Can we deliver Project Alpha?',
  'Suggest people for this project',
];

interface Exchange {
  question: string;
  answer: AiAnswer;
}

export default function AiPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion('');
    try {
      const res = await api.post<AiAnswer>('/ai/ask', { question: q });
      setHistory((h) => [{ question: q, answer: res.data }, ...h]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h1 className="text-xl font-semibold">Ask AI</h1>
      </div>
      <p className="text-sm text-slate-500">
        Ask about availability, skills, and delivery risk in plain language. Answers are computed live from the current
        capacity data (deterministic, no external AI service required for this demo).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Who is overallocated?"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !question.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-slate-400">Thinking…</div>}

      <div className="flex flex-col gap-4">
        {history.map((ex, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">“{ex.question}”</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{ex.answer.answer}</div>
              {ex.answer.candidates?.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {ex.answer.candidates.map((c) => (
                    <Link
                      key={c.id}
                      href={`/people/${c.id}`}
                      className="flex items-center gap-3 rounded-md border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                    >
                      <Avatar name={c.name} className="h-8 w-8" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-slate-500">
                          {c.jobTitle} {c.team ? `· ${c.team}` : ''}
                        </div>
                      </div>
                      <ResourceStatusBadge status={c.status} />
                      <div className="w-20">
                        <Progress value={c.utilization} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
