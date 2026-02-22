import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <div className="spinner-three-body">
        <div className="spinner-three-body__dot" />
        <div className="spinner-three-body__dot" />
        <div className="spinner-three-body__dot" />
      </div>
    </div>
  )
}

export { Spinner }
