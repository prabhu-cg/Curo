import { useCallback, useState } from 'react';
import { buildImportPreview } from '@/services/importService';
import {
  getExistingNormalizedUrls,
  importParsedBookmarks,
} from '@/services/bookmarkService';
import type { ImportPreview, ImportSummary } from '@/types';

type ImportFlowStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

interface ImportFlowState {
  status: ImportFlowStatus;
  fileName: string | null;
  preview: ImportPreview | null;
  summary: ImportSummary | null;
  error: string | null;
}

const INITIAL_STATE: ImportFlowState = {
  status: 'idle',
  fileName: null,
  preview: null,
  summary: null,
  error: null,
};

export function useImportFlow() {
  const [state, setState] = useState<ImportFlowState>(INITIAL_STATE);

  const selectFile = useCallback(async (file: File) => {
    setState({ ...INITIAL_STATE, status: 'parsing', fileName: file.name });
    try {
      const html = await file.text();
      const existingUrls = await getExistingNormalizedUrls();
      const preview = buildImportPreview(file.name, html, existingUrls);
      setState({
        status: 'preview',
        fileName: file.name,
        preview,
        summary: null,
        error: null,
      });
    } catch {
      setState({
        status: 'error',
        fileName: file.name,
        preview: null,
        summary: null,
        error: 'This file could not be read. Make sure it is a bookmarks HTML export.',
      });
    }
  }, []);

  const confirmImport = useCallback(
    async (skipDuplicates: boolean) => {
      if (!state.preview) return;
      setState((prev) => ({ ...prev, status: 'importing' }));
      const summary = await importParsedBookmarks(
        state.preview.validBookmarks,
        state.preview.issues,
        { skipInvalidEntries: true, skipDuplicates },
      );
      setState((prev) => ({ ...prev, status: 'done', summary }));
    },
    [state.preview],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, selectFile, confirmImport, reset };
}
