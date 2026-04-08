import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Trash2 } from "lucide-react"

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive" 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[32px] bg-white p-8">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-3xl ${variant === 'destructive' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'} flex items-center justify-center mb-6`}>
            {variant === 'destructive' ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium mt-2 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8 sm:justify-center">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 rounded-2xl h-14 font-black text-xs tracking-widest text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all uppercase"
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-2xl h-14 font-black text-xs tracking-widest uppercase shadow-xl active:scale-95 transition-all ${variant !== 'destructive' ? 'bg-black text-[#fffe01] hover:bg-zinc-800' : ''}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
