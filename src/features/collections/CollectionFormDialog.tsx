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
import { createCollection, updateCollection } from '@/services/collectionService';
import type { Collection } from '@/types';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
});

type FormValues = z.infer<typeof formSchema>;

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
}

function toFormValues(collection: Collection | undefined): FormValues {
  return {
    name: collection?.name ?? '',
    description: collection?.description ?? '',
  };
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
}: CollectionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(collection),
  });

  useEffect(() => {
    if (open) reset(toFormValues(collection));
  }, [open, collection, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (collection) {
      await updateCollection(collection.id, {
        name: values.name,
        description: values.description || undefined,
      });
    } else {
      await createCollection({
        name: values.name,
        description: values.description || undefined,
      });
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{collection ? 'Rename collection' : 'New collection'}</DialogTitle>
          <DialogDescription>
            Custom collections group bookmarks however you like.
          </DialogDescription>
        </DialogHeader>

        <form
          id="collection-form"
          className="space-y-4"
          onSubmit={(e) => {
            void onSubmit(e);
          }}
        >
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="collection-name">Name</FieldLabel>
            <Input id="collection-name" {...register('name')} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="collection-description">Description</FieldLabel>
            <Textarea id="collection-description" rows={2} {...register('description')} />
          </Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="collection-form" disabled={isSubmitting}>
            {collection ? 'Save changes' : 'Create collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
