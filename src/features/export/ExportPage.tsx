import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBookmarks, useCollections, useSettings } from '@/hooks';
import {
  downloadBlob,
  downloadTextFile,
  generateExport,
  generateExportZip,
} from '@/services/exportService';
import type { ExportFormat } from '@/types';

type Scope = 'all' | 'favorites' | 'collection';

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  {
    value: 'html',
    label: 'HTML',
    description: 'Standard bookmarks file, importable anywhere',
  },
  { value: 'csv', label: 'CSV', description: 'Spreadsheet-friendly table' },
  { value: 'json', label: 'JSON', description: 'Full, lossless machine-readable data' },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Readable list grouped by folder',
  },
];

export function ExportPage() {
  const { bookmarks } = useBookmarks();
  const { collections } = useCollections(bookmarks);
  const { settings } = useSettings();

  const [scope, setScope] = useState<Scope>('all');
  const [collectionId, setCollectionId] = useState<string | undefined>(undefined);
  const [formats, setFormats] = useState<Set<ExportFormat>>(
    new Set([settings.exportBehavior.defaultFormat]),
  );
  const [includeFolderStructure, setIncludeFolderStructure] = useState(
    settings.exportBehavior.includeFolderStructure,
  );
  const [isExporting, setIsExporting] = useState(false);

  const collectionNameById = useMemo(
    () => new Map(collections.map((c) => [c.id, c.name])),
    [collections],
  );

  const scopedBookmarks = useMemo(() => {
    if (scope === 'favorites') return bookmarks.filter((b) => b.isFavorite);
    if (scope === 'collection' && collectionId) {
      return bookmarks.filter((b) => b.collectionIds.includes(collectionId));
    }
    return bookmarks;
  }, [scope, collectionId, bookmarks]);

  function toggleFormat(format: ExportFormat, checked: boolean) {
    setFormats((prev) => {
      const next = new Set(prev);
      if (checked) next.add(format);
      else next.delete(format);
      return next;
    });
  }

  async function handleExport() {
    if (formats.size === 0) {
      toast.error('Choose at least one format to export.');
      return;
    }
    if (scopedBookmarks.length === 0) {
      toast.error('No bookmarks match this scope.');
      return;
    }

    setIsExporting(true);
    try {
      const formatList = Array.from(formats);
      if (formatList.length === 1) {
        const format = formatList[0];
        if (!format) return;
        const { content, fileName, mimeType } = generateExport(format, scopedBookmarks, {
          includeFolderStructure,
          collectionNameById,
        });
        downloadTextFile(content, fileName, mimeType);
      } else {
        const blob = await generateExportZip(formatList, scopedBookmarks, {
          includeFolderStructure,
          collectionNameById,
        });
        downloadBlob(blob, 'curo-bookmarks-export.zip');
      }
      toast.success(`Exported ${scopedBookmarks.length} bookmarks`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Export bookmarks</h2>
        <p className="text-sm text-[#555555]">
          Take your bookmarks with you in any format, any time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">What to export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="all" /> All bookmarks ({bookmarks.length})
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="favorites" /> Favorites only (
              {bookmarks.filter((b) => b.isFavorite).length})
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="collection" /> A specific collection
            </Label>
          </RadioGroup>

          {scope === 'collection' && (
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger className="w-full sm:w-64" aria-label="Choose collection">
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name} ({collection.bookmarkCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FORMAT_OPTIONS.map((option) => (
            <Label
              key={option.value}
              className="flex items-start gap-3 font-normal"
              htmlFor={`format-${option.value}`}
            >
              <Checkbox
                id={`format-${option.value}`}
                checked={formats.has(option.value)}
                onCheckedChange={(checked) =>
                  toggleFormat(option.value, checked === true)
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-[#555555]">{option.description}</span>
              </span>
            </Label>
          ))}

          <div className="border-t pt-3">
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={includeFolderStructure}
                onCheckedChange={(checked) => setIncludeFolderStructure(checked === true)}
              />
              Preserve folder structure (HTML &amp; Markdown)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => void handleExport()} disabled={isExporting}>
        <Download /> Export {scopedBookmarks.length} bookmark
        {scopedBookmarks.length === 1 ? '' : 's'}
      </Button>
    </div>
  );
}
