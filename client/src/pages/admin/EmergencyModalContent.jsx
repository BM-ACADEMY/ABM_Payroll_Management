import React from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert } from "lucide-react";

const EmergencyModalContent = ({ 
  date, 
  emergencyData, 
  setEmergencyData, 
  attendance, 
  onSubmit, 
  onClose, 
  loading 
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-rose-600">
          <ShieldAlert className="w-5 h-5" />
          Emergency Override
        </DialogTitle>
        <DialogDescription>
          Manually log or update attendance for {format(new Date(date), 'MMMM dd, yyyy')}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Employee Name</Label>
            {emergencyData.userId ? (
              <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center">
                <span className="font-normal text-gray-900">
                  {attendance.find(a => a.user?._id === emergencyData.userId)?.user?.name || 'Unknown'}
                </span>
              </div>
            ) : (
              <Select 
                value={emergencyData.userId} 
                onValueChange={(val) => setEmergencyData({ ...emergencyData, userId: val })}
              >
                <SelectTrigger className={emergencyData.userId ? "opacity-75" : ""}>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {attendance.map(a => (
                    <SelectItem key={a.user?._id} value={a.user?._id}>{a.user?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Employee ID</Label>
            <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center">
              <span className="text-sm text-gray-500 font-mono">
                {emergencyData.userId 
                  ? (attendance.find(a => a.user?._id === emergencyData.userId)?.user?.employeeId || 'No ID assigned')
                  : 'Select an employee first'}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Check In Time</Label>
            <Input 
              type="time" 
              value={emergencyData.checkInTime} 
              onChange={(e) => setEmergencyData({ ...emergencyData, checkInTime: e.target.value })} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Check Out Time (Optional)</Label>
            <Input 
              type="time" 
              value={emergencyData.checkOutTime} 
              onChange={(e) => setEmergencyData({ ...emergencyData, checkOutTime: e.target.value })} 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Environment Mode</Label>
            <Select 
              value={emergencyData.mode} 
              onValueChange={(val) => setEmergencyData({ ...emergencyData, mode: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="WFO">WFO</SelectItem>
                <SelectItem value="WFH">WFH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
            {loading ? "Processing..." : "Submit Override"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default EmergencyModalContent;
