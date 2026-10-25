import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const swatches = [
  { className: 'bg-background', name: 'background' },
  { className: 'bg-foreground', name: 'foreground' },
  { className: 'bg-card', name: 'card' },
  { className: 'bg-primary', name: 'primary' },
  { className: 'bg-muted', name: 'muted' },
  { className: 'bg-border', name: 'border' },
  { className: 'bg-destructive', name: 'destructive' },
  { className: 'bg-ring', name: 'ring' },
] as const

/**
 * Token, type, and control specimen. It follows the document theme
 * (`light` / `dark` on `<html>`), so the header toggle is how you see both.
 */
export function ThemeSpecimen() {
  const fieldPrefix = 'design'

  return (
    <section className="flex flex-col gap-8 rounded-xl border border-border bg-background p-6 text-foreground">
      <div>
        <h3 className="font-sans text-small text-muted-foreground">Color</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {swatches.map((swatch) => (
            <li className="flex items-center gap-2" key={swatch.name}>
              <span
                className={cn('size-8 shrink-0 rounded-md ring-1 ring-border', swatch.className)}
              />
              <span className="font-sans text-small text-muted-foreground">{swatch.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div className="max-w-measure">
        <h3 className="font-sans text-small text-muted-foreground">Type</h3>
        <div className="mt-3 flex flex-col gap-3">
          <p className="font-serif text-display">Display</p>
          <p className="font-serif text-h1">Heading one</p>
          <p className="font-serif text-h2">Heading two</p>
          <p className="font-serif text-h3">Heading three</p>
          <p className="font-serif text-lead text-muted-foreground">
            A lead for the opening line of an essay.
          </p>
          <p className="font-serif text-body">
            Тиха типографіка тримає довге читання. Спокойный набор для русской строки. A body
            paragraph stays inside the measure.
          </p>
          <p className="font-sans text-small text-muted-foreground">
            Small sans for chrome, dates, and meta.
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-sans text-small text-muted-foreground">Controls</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button">Primary</Button>
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button" variant="outline">
            Outline
          </Button>
          <Button type="button" variant="ghost">
            Ghost
          </Button>
          <Button type="button" variant="destructive">
            Destructive
          </Button>
          <Button type="button" variant="link">
            Link
          </Button>
          <Button disabled type="button">
            Disabled
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Note</Badge>
          <Badge variant="secondary">Article</Badge>
          <Badge variant="outline">Tag</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={`${fieldPrefix}-title`}>Title</Label>
            <Input id={`${fieldPrefix}-title`} placeholder="A short line" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${fieldPrefix}-body`}>Body</Label>
            <Textarea id={`${fieldPrefix}-body`} placeholder="A paragraph" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Reading card</CardTitle>
          <CardDescription>A quiet surface for a note or article meta.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-measure font-serif text-body">
            The card is a surface, not a dashboard tile. Body type stays serif.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
