import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MAX_VISIBLE = 2;

/**
 * Lista compacta de cursos como etiquetas: muestra los primeros y un "+N" con tooltip para el resto.
 * Requiere un `TooltipProvider` arriba en el árbol.
 */
export function CourseTags({
  titles,
  muted = false,
  emptyLabel = "Sin curso",
}: {
  titles: string[];
  muted?: boolean;
  emptyLabel?: string;
}) {
  if (titles.length === 0) {
    return <span className="text-gray-400">{emptyLabel}</span>;
  }
  const visible = titles.slice(0, MAX_VISIBLE);
  const hidden = titles.slice(MAX_VISIBLE);

  return (
    <div className="flex min-w-0 items-center gap-1">
      {visible.map((title) => (
        <span
          key={title}
          className={`max-w-[200px] truncate rounded-full px-2 py-0.5 text-xs ${
            muted ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-gray-600"
          }`}
          title={title}
        >
          {title}
        </span>
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 cursor-default rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
              +{hidden.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="space-y-0.5">
              {hidden.map((title) => (
                <p key={title}>{title}</p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
