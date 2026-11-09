import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SearchFormLabels = {
  placeholder: string
  submit: string
}

type SearchFormProps = {
  defaultQuery?: string
  labels: SearchFormLabels
}

/** GET form so `?q=` is shareable and survives a locale switch. */
export function SearchForm({ defaultQuery = '', labels }: SearchFormProps) {
  return (
    <form className="mt-8 flex flex-wrap items-end gap-3 font-sans" method="get" role="search">
      <div className="min-w-0 flex-1 basis-48">
        <label className="sr-only" htmlFor="search-q">
          {labels.placeholder}
        </label>
        <Input
          autoComplete="off"
          defaultValue={defaultQuery}
          enterKeyHint="search"
          id="search-q"
          name="q"
          placeholder={labels.placeholder}
          type="search"
        />
      </div>
      <Button type="submit">{labels.submit}</Button>
    </form>
  )
}
