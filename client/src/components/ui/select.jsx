import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange, className, ...props }) => {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={containerRef} className={cn("relative inline-block", className)} {...props}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectContext = React.createContext({})

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <div className="flex-1 text-left truncate">{children}</div>
      <span className={`ml-1 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </span>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, children }) => {
  const { value } = React.useContext(SelectContext)
  return <span className="truncate">{children || value || placeholder}</span>
}

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open } = React.useContext(SelectContext)
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-[100] mt-1 min-w-[200px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1 text-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value: itemValue, ...props }, ref) => {
  const { onValueChange, setOpen, value } = React.useContext(SelectContext)
  const isSelected = String(value).toLowerCase() === String(itemValue).toLowerCase()
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-3 text-[11px] font-medium uppercase tracking-wider outline-none hover:bg-zinc-50 hover:text-zinc-900 transition-colors",
        isSelected ? "bg-zinc-50 text-zinc-900" : "text-zinc-500",
        className
      )}
      onClick={() => {
        onValueChange && onValueChange(itemValue)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
