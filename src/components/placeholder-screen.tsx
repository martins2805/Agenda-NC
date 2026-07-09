import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function PlaceholderScreen({
  icon: Icon,
  title,
  description,
  sprintLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  sprintLabel: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">{sprintLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
