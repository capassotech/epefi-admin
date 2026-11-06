import { Toaster as Sonner, toast } from "sonner"
import { CircleCheck, CircleX, TriangleAlert, Info, Loader2 } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Los toasts siguen el tema elegido en el admin, no el del sistema operativo.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      gap={10}
      offset={20}
      // En mobile, por encima de la barra de acciones fija de los formularios
      mobileOffset={{ bottom: 76 }}
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
