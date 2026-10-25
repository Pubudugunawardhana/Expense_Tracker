import { useRef, useState } from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedTransaction } from '@spendly/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParseText, useScanReceipt } from '@/hooks/api';

const EXAMPLES = ['lunch 1500 yesterday', 'salary 285000 on the 25th', 'uber $12 last friday'];

/** Natural-language quick add and receipt scanning, both powered by Claude. */
export function AiAssist({ onResult }: { onResult: (draft: ParsedTransaction) => void }) {
  const [text, setText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const parse = useParseText();
  const scan = useScanReceipt();
  const busy = parse.isPending || scan.isPending;

  const submit = () => {
    if (text.trim().length < 2) return;
    parse.mutate(text, {
      onSuccess: (draft) => {
        onResult(draft);
        setText('');
        toast.success('Filled in from your description – check and save.');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    scan.mutate(file, {
      onSuccess: (draft) => {
        onResult(draft);
        toast.success('Receipt scanned – check the details and save.');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" /> AI quick add
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={`Try “${EXAMPLES[0]}”`}
          disabled={busy}
          aria-label="Describe a transaction"
          className="bg-background"
        />
        <Button type="button" size="icon" onClick={submit} disabled={busy || text.trim().length < 2} aria-label="Fill with AI">
          {parse.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          aria-label="Scan a receipt"
          title="Scan a receipt"
        >
          {scan.isPending ? <Loader2 className="animate-spin" /> : <Camera />}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.slice(1).map((example) => (
          <button
            key={example}
            type="button"
            className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setText(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
