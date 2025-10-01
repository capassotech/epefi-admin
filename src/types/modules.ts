// Types and interfaces for modules and content

export interface ModuloForm {
  titulo: string;
  descripcion: string;
  bibliografia: string;
  url_miniatura: string;
  url_contenido: string;
  tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra";
}

export type ContentType = "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra";

export interface ContentTypeOption {
  value: ContentType;
  label: string;
  icon: React.ReactNode;
}
