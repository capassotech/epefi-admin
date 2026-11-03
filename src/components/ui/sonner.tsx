import { Toaster as Sonner, toast } from "sonner"
import { CircleCheck, CircleX, TriangleAlert, Info, Loader2 } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

// El admin no tiene modo oscuro: forzamos "light" para que los toasts no
// se pongan oscuros cuando el sistema operativo del usuario lo está.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      gap={10}
      offset={20}
      visibleToasts={4}
      className="toaster"
      icons={{
        success: <span className="toast-icon" data-kind="success"><CircleCheck /></span>,
        error: <span className="toast-icon" data-kind="error"><CircleX /></span>,
        warning: <span className="toast-icon" data-kind="warning"><TriangleAlert /></span>,
        info: <span className="toast-icon" data-kind="info"><Info /></span>,
        loading: <span className="toast-icon" data-kind="loading"><Loader2 className="animate-spin" /></span>,
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
