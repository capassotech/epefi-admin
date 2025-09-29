import React from "react";
import { Button } from "@/components/ui/button";
import { Video, FileText, HelpCircle, ImageIcon, File } from "lucide-react";
import { ContenidoForm, ContentTypeOption } from "@/types/modules";

interface ContenidoFormRowProps {
  index: number;
  content: ContenidoForm;
  onChange: (updated: ContenidoForm) => void;
  onRemove: () => void;
}

export default function ContenidoFormRow({
  index,
  content,
  onChange,
  onRemove,
}: ContenidoFormRowProps) {
  const tipos: ContentTypeOption[] = [
    { value: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
    { value: "pdf", label: "PDF", icon: <FileText className="w-4 h-4" /> },
    {
      value: "evaluacion",
      label: "Evaluación",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      value: "imagen",
      label: "Imagen",
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      value: "contenido_extra",
      label: "Contenido Extra",
      icon: <File className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">Contenido {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          Eliminar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Título *</label>
          <input
            type="text"
            className="w-full p-2 border rounded text-sm"
            value={content.titulo}
            onChange={(e) => onChange({ ...content, titulo: e.target.value })}
            placeholder="Ej: Introducción al Liderazgo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Tipo de Contenido *
          </label>
          <select
            className="w-full p-2 border rounded text-sm"
            value={content.tipo_contenido}
            onChange={(e) =>
              onChange({
                ...content,
                tipo_contenido: e.target.value as ContenidoForm["tipo_contenido"],
              })
            }
          >
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Descripción *
        </label>
        <textarea
          className="w-full p-2 border rounded text-sm"
          rows={2}
          value={content.descripcion}
          onChange={(e) =>
            onChange({ ...content, descripcion: e.target.value })
          }
          placeholder="Describe el contenido..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            URL del Contenido *
          </label>
          <input
            type="url"
            className="w-full p-2 border rounded text-sm"
            value={content.url_contenido}
            onChange={(e) =>
              onChange({ ...content, url_contenido: e.target.value })
            }
            placeholder="https://example.com/..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            URL Miniatura (opcional)
          </label>
          <input
            type="url"
            className="w-full p-2 border rounded text-sm"
            value={content.url_miniatura || ""}
            onChange={(e) =>
              onChange({
                ...content,
                url_miniatura: e.target.value || null,
              })
            }
            placeholder="https://example.com/thumbnail.jpg"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Duración (segundos) *
        </label>
        <input
          type="number"
          min="0"
          className="w-full p-2 border rounded text-sm"
          value={content.duracion}
          onChange={(e) =>
            onChange({
              ...content,
              duracion: parseInt(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          Ej: 1800 segundos = 30 minutos
        </p>
      </div>
    </div>
  );
}
