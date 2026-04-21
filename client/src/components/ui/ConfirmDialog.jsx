import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone and will permanently delete the data.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive" 
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <div className="bg-zinc-900 p-8 text-[#fffe01]">
          <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter">{title}</AlertDialogTitle>
        </div>
        <div className="p-8 space-y-6">
          <AlertDialogDescription className="text-zinc-500 font-bold text-sm leading-relaxed">
            {description}
          </AlertDialogDescription>
          <AlertDialogFooter className="gap-3 sm:gap-0 sm:flex-row mt-6">
            <AlertDialogCancel className="rounded-xl h-12 border-zinc-200 font-bold text-zinc-400 hover:text-zinc-900 transition-all">
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-xl h-12 font-black uppercase tracking-widest text-[10px] transition-all px-8 ${
                variant === 'destructive' 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100' 
                  : 'bg-zinc-900 hover:bg-black text-[#fffe01] shadow-lg shadow-zinc-100'
              }`}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
