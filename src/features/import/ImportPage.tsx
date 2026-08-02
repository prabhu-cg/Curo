import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImportFlow } from './useImportFlow';

const MAX_PREVIEW_ROWS = 50;
const MAX_ISSUES_SHOWN = 12;

export function ImportPage() {
  const flow = useImportFlow();
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith('.html') &&
      !file.name.toLowerCase().endsWith('.htm')
    ) {
      toast.error('Please choose an HTML bookmarks export file.');
      return;
    }
    void flow.selectFile(file);
  }

  async function handleConfirm() {
    await flow.confirmImport(skipDuplicates);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Import bookmarks</h2>
        <p className="text-sm text-muted-foreground">
          Export your bookmarks as an HTML file from Chrome, Firefox, Safari, or Edge,
          then bring them into Curo.
        </p>
      </div>

      {flow.status === 'idle' && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose or drop a bookmarks HTML file to import"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
            isDraggingOver ? 'border-primary bg-accent' : 'hover:bg-muted/50'
          }`}
        >
          <UploadCloud className="mb-4 size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">
            Drop your bookmarks HTML file here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports the standard Netscape bookmarks format exported by every major
            browser
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {flow.status === 'parsing' && (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          Reading {flow.fileName}…
        </div>
      )}

      {flow.status === 'error' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="text-destructive size-8" aria-hidden="true" />
            <p className="text-sm">{flow.error}</p>
            <Button variant="outline" onClick={flow.reset}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {flow.status === 'preview' && flow.preview && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{flow.fileName}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Found" value={flow.preview.totalFound} />
              <Stat label="Ready to import" value={flow.preview.validBookmarks.length} />
              <Stat label="Already saved" value={flow.preview.duplicatesWithExisting} />
              <Stat label="Issues" value={flow.preview.issues.length} />
            </CardContent>
          </Card>

          {flow.preview.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Issues found</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {flow.preview.issues.slice(0, MAX_ISSUES_SHOWN).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle
                        className={`mt-0.5 size-3.5 shrink-0 ${
                          issue.level === 'error' ? 'text-destructive' : 'text-[#b08900]'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
                {flow.preview.issues.length > MAX_ISSUES_SHOWN && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    +{flow.preview.issues.length - MAX_ISSUES_SHOWN} more
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-72">
                <ul className="divide-y px-6 pb-4">
                  {flow.preview.validBookmarks
                    .slice(0, MAX_PREVIEW_ROWS)
                    .map((node, i) => (
                      <li key={i} className="py-2">
                        <p className="truncate text-sm font-medium">{node.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {node.folderPath.length > 0 &&
                            `${node.folderPath.join(' / ')} · `}
                          {node.url}
                        </p>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
              {flow.preview.validBookmarks.length > MAX_PREVIEW_ROWS && (
                <p className="border-t px-6 py-3 text-xs text-muted-foreground">
                  +{flow.preview.validBookmarks.length - MAX_PREVIEW_ROWS} more not shown
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Checkbox
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
            />
            <Label htmlFor="skip-duplicates" className="text-sm font-normal">
              Skip bookmarks already in your library
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void handleConfirm()}>
              <FileUp /> Import {flow.preview.validBookmarks.length} bookmark
              {flow.preview.validBookmarks.length === 1 ? '' : 's'}
            </Button>
            <Button variant="outline" onClick={flow.reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {flow.status === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          Importing your bookmarks…
        </div>
      )}

      {flow.status === 'done' && flow.summary && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="size-8 text-[#2a6f6f]" aria-hidden="true" />
            <p className="text-sm">
              Imported <strong>{flow.summary.imported}</strong> bookmark
              {flow.summary.imported === 1 ? '' : 's'}
              {flow.summary.skipped > 0 && (
                <>
                  {' '}
                  · skipped <strong>{flow.summary.skipped}</strong>
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/bookmarks">View bookmarks</Link>
              </Button>
              <Button variant="outline" onClick={flow.reset}>
                Import another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-foreground text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
