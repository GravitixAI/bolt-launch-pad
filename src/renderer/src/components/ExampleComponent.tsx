import { Button } from '@/components/ui/button';

interface ExampleComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

/**
 * Example component demonstrating best practices for this boilerplate
 * - TypeScript interfaces for props
 * - shadcn/ui components
 * - Tailwind CSS styling
 */
export function ExampleComponent({ 
  title, 
  description, 
  onAction 
}: ExampleComponentProps) {
  return (
    <div className="p-6 border rounded-lg space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      {onAction && (
        <Button onClick={onAction}>
          Take Action
        </Button>
      )}
    </div>
  );
}

