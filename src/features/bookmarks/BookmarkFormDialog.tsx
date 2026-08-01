import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { normalizeUrl } from '@/services/urlNormalizer';
import { createBookmark, updateBookmark } from '@/services/bookmarkService';
import type { Bookmark } from '@/types';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .refine((value) => normalizeUrl(value).isValid, 'Enter a valid URL'),
  tags: z.string().trim(),
  notes: z.string().trim(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookmarkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark?: Bookmark;
  onSaved?: () => void;
}

function toFormValues(bookmark: Bookmark | undefined): FormValues {
  return {
    title: bookmark?.title ?? '',
    url: bookmark?.url ?? '',
    tags: bookmark?.tags.join(', ') ?? '',
    notes: bookmark?.notes ?? '',
  };
}

export function BookmarkFormDialog({
  open,
  onOpenChange,
  bookmark,
  onSaved,
}: BookmarkFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(bookmark),
  });

  useEffect(() => {
    if (open) reset(toFormValues(bookmark));
  }, [open, bookmark, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (bookmark) {
      await updateBookmark(bookmark.id, {
        title: values.title,
        url: values.url,
        tags,
        notes: values.notes || undefined,
      });
    } else {
      await createBookmark({
        title: values.title,
        url: values.url,
        tags,
        notes: values.notes || undefined,
        folderPath: [],
        source: 'manual',
      });
    }

    onSaved?.();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit bookmark' : 'New bookmark'}</DialogTitle>
          <DialogDescription>
            {bookmark
              ? 'Update the details for this bookmark.'
              : 'Add a bookmark directly to your library.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="bookmark-form"
          className="space-y-4"
          onSubmit={(e) => {
            void onSubmit(e);
          }}
        >
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="bookmark-title">Title</FieldLabel>
            <Input id="bookmark-title" {...register('title')} />
            <FieldError errors={errors.title ? [errors.title] : undefined} />
          </Field>

          <Field data-invalid={Boolean(errors.url)}>
            <FieldLabel htmlFor="bookmark-url">URL</FieldLabel>
            <Input
              id="bookmark-url"
              placeholder="https://example.com"
              {...register('url')}
            />
            <FieldError errors={errors.url ? [errors.url] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="bookmark-tags">Tags</FieldLabel>
            <Input
              id="bookmark-tags"
              placeholder="design, tools, reading"
              {...register('tags')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bookmark-notes">Notes</FieldLabel>
            <Textarea id="bookmark-notes" rows={3} {...register('notes')} />
          </Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="bookmark-form" disabled={isSubmitting}>
            {bookmark ? 'Save changes' : 'Add bookmark'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
