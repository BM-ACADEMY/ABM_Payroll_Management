import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative" {...props}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectContext = React.createContext({})

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value } = React.useContext(SelectContext)
  const [open, setOpen] = React.useState(false)
  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <span className="ml-2 opacity-50">▼</span>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md mt-1 w-full",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value: itemValue, ...props }, ref) => {
  const { onValueChange } = React.useContext(SelectContext)
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
        className
      )}
      onClick={() => onValueChange && onValueChange(itemValue)}
      {...props}
    >
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
