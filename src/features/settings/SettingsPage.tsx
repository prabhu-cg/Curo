import { useRef, useState } from 'react';
import {
  Database,
  Download,
  FlaskConical,
  Keyboard,
  Palette,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks';
import {
  createBackup,
  InvalidBackupError,
  restoreBackup,
} from '@/services/settingsService';
import { downloadTextFile } from '@/services/exportService';
import { clearAllBookmarks } from '@/services/bookmarkService';
import { seedDemoData } from '@/services/demoDataService';
import { MOD_KEY_LABEL } from '@/lib/platform';
import type { ExportFormat, UiDensity } from '@/types';

export function SettingsPage() {
  const { settings, update } = useSettings();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [confirmRestore, setConfirmRestore] = useState<File | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleCreateBackup() {
    const json = await createBackup();
    downloadTextFile(
      json,
      `curo-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json',
    );
    toast.success('Backup downloaded');
  }

  async function handleRestore() {
    if (!confirmRestore) return;
    try {
      const text = await confirmRestore.text();
      await restoreBackup(text);
      toast.success('Backup restored');
    } catch (error) {
      const message =
        error instanceof InvalidBackupError ? error.message : 'Could not restore backup.';
      toast.error(message);
    } finally {
      setConfirmRestore(null);
    }
  }

  async function handleClearAll() {
    await clearAllBookmarks();
    setConfirmClear(false);
    toast.success('All bookmarks cleared');
  }

  async function handleSeedDemoData() {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await update({ demoDataEnabled: true });
      toast.success('Sample bookmarks added');
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="-mt-4 text-sm text-muted-foreground">
        Preferences are stored in this browser and apply to all your bookmarks.
      </p>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="size-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.appearance.density}
            onValueChange={(value) =>
              void update({ appearance: { density: value as UiDensity } })
            }
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="comfortable" /> Comfortable
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="compact" /> Compact
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Upload className="size-4" /> Import behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border divide-y">
          <div className="flex items-center justify-between gap-4 pb-3">
            <Label htmlFor="auto-normalize" className="font-normal">
              Normalize URLs and strip tracking parameters
            </Label>
            <Switch
              id="auto-normalize"
              checked={settings.importBehavior.autoNormalizeUrls}
              onCheckedChange={(checked) =>
                void update({
                  importBehavior: {
                    ...settings.importBehavior,
                    autoNormalizeUrls: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <Label htmlFor="auto-dedupe" className="font-normal">
              Skip duplicates already in your library
            </Label>
            <Switch
              id="auto-dedupe"
              checked={settings.importBehavior.autoDetectDuplicatesOnImport}
              onCheckedChange={(checked) =>
                void update({
                  importBehavior: {
                    ...settings.importBehavior,
                    autoDetectDuplicatesOnImport: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Download className="size-4" /> Export behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border divide-y">
          <div className="flex items-center justify-between gap-4 pb-3">
            <Label htmlFor="default-format" className="font-normal">
              Default format
            </Label>
            <Select
              value={settings.exportBehavior.defaultFormat}
              onValueChange={(value) =>
                void update({
                  exportBehavior: {
                    ...settings.exportBehavior,
                    defaultFormat: value as ExportFormat,
                  },
                })
              }
            >
              <SelectTrigger id="default-format" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <Label htmlFor="preserve-folders" className="font-normal">
              Preserve folder structure by default
            </Label>
            <Switch
              id="preserve-folders"
              checked={settings.exportBehavior.includeFolderStructure}
              onCheckedChange={(checked) =>
                void update({
                  exportBehavior: {
                    ...settings.exportBehavior,
                    includeFolderStructure: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4" /> Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {settings.backup.lastBackupAt
              ? `Last backup: ${new Date(settings.backup.lastBackupAt).toLocaleString()}`
              : 'No backup created yet.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void handleCreateBackup()}>
              <Database /> Download backup
            </Button>
            <Button variant="outline" onClick={() => restoreInputRef.current?.click()}>
              <Upload /> Restore from backup
            </Button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setConfirmRestore(file);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Keyboard className="size-4" /> Keyboard shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border divide-y">
          <div className="flex items-center justify-between gap-4 pb-3">
            <Label htmlFor="shortcuts-enabled" className="font-normal">
              Enable keyboard shortcuts
            </Label>
            <Switch
              id="shortcuts-enabled"
              checked={settings.keyboardShortcutsEnabled}
              onCheckedChange={(checked) =>
                void update({ keyboardShortcutsEnabled: checked })
              }
            />
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 pt-3 text-sm">
            <dt>
              <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">
                {MOD_KEY_LABEL}K
              </kbd>
            </dt>
            <dd className="text-muted-foreground">Jump to search</dd>
            <dt>
              <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">Tab</kbd>
            </dt>
            <dd className="text-muted-foreground">Move between controls</dd>
            <dt>
              <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">Enter</kbd> /{' '}
              <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">Space</kbd>
            </dt>
            <dd className="text-muted-foreground">Activate the focused control</dd>
            <dt>
              <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">Esc</kbd>
            </dt>
            <dd className="text-muted-foreground">Close a dialog or menu</dd>
          </dl>
        </CardContent>
      </Card>

      {import.meta.env.DEV && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4" /> Development
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void handleSeedDemoData()}
              disabled={isSeeding}
            >
              Load sample data
            </Button>
            <Button variant="destructive" onClick={() => setConfirmClear(true)}>
              <Trash2 /> Clear all bookmarks
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirmRestore !== null}
        onOpenChange={(open) => !open && setConfirmRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore from backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all current bookmarks, collections, and settings with the
              contents of "{confirmRestore?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRestore()}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every bookmark. Collections and settings are kept.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleClearAll()}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
