import { useState } from 'react';
import { MessageSquareHeart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { feedbackInputSchema } from '@spendly/shared';
import { EmptyState, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useFeedback, useSendFeedback } from '@/hooks/api';
import { formatAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn(size, star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
      ))}
    </span>
  );
}

export function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const { data: entries = [] } = useFeedback();
  const send = useSendFeedback();

  const submit = () => {
    const parsed = feedbackInputSchema.safeParse({ rating, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please complete the form');
      return;
    }
    send.mutate(parsed.data, {
      onSuccess: () => {
        toast.success('Thanks for your feedback! 💜');
        setRating(0);
        setMessage('');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Feedback" description="Tell us what you love and what we could do better." />
      <Card>
        <CardHeader>
          <CardTitle>How's Spendly working for you?</CardTitle>
          <CardDescription>{LABELS[hover || rating] || 'Pick a rating'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" role="radio" aria-checked={rating === star} aria-label={`${star} stars`}
                onMouseEnter={() => setHover(star)} onClick={() => setRating(star)} className="rounded p-1 transition-transform hover:scale-110">
                <Star className={cn('size-8', star <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
              </button>
            ))}
          </div>
          <Textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Your thoughts, ideas or bugs you found…" />
          <Button onClick={submit} disabled={send.isPending}>Send feedback</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your previous feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState icon={MessageSquareHeart} title="No feedback yet" className="py-6" />
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Stars value={entry.rating} />
                    <span className="text-xs text-muted-foreground">{formatAgo(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm">{entry.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
