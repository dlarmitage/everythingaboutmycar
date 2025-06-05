import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Vehicle } from '../types';

interface VehicleDetailsModalProps {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export default function VehicleDetailsModal({ open, vehicle, onClose, onSave, onDelete }: VehicleDetailsModalProps) {
  const [form, setForm] = useState<Vehicle | null>(vehicle);
  const [dirty, setDirty] = useState(false);
  const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Keep form in sync with vehicle prop
  useEffect(() => {
    setForm(vehicle);
    setOriginalVehicle(vehicle);
    setDirty(false);
  }, [vehicle, open]);

  // Function to compare vehicle data for changes
  const hasVehicleChanged = (current: Vehicle | null, original: Vehicle | null): boolean => {
    if (!current || !original) return false;
    
    return (
      current.year !== original.year ||
      current.make !== original.make ||
      current.model !== original.model ||
      current.body_class !== original.body_class ||
      current.vin !== original.vin ||
      current.color !== original.color ||
      current.license_plate !== original.license_plate ||
      current.mileage !== original.mileage ||
      current.purchase_date !== original.purchase_date ||
      current.purchase_price !== original.purchase_price
    );
  };

  // Track edits with proper change detection
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    
    // Check if data has actually changed from original
    const hasChanged = hasVehicleChanged(updatedForm, originalVehicle);
    setDirty(hasChanged);
  };

  // Handle auto-save on close
  const handleClose = () => {
    if (dirty && form) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Handle saving pending changes
  const handleSavePendingChanges = () => {
    if (form) {
      onSave(form);
      setDirty(false);
    }
    setShowUnsavedChangesDialog(false);
    onClose();
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    setDirty(false);
    onClose();
  };

  if (!form) return null;

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-40 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Vehicle Details
                    </Dialog.Title>
                    
                    {/* Close button (X) in upper right */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <form className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">Year</label>
                        <input name="year" value={form.year ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Make</label>
                        <input name="make" value={form.make ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Model</label>
                        <input name="model" value={form.model ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Body Class</label>
                        <input name="body_class" value={form.body_class ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">VIN</label>
                        <input name="vin" value={form.vin ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" maxLength={17} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Color</label>
                        <input name="color" value={form.color ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">License Plate</label>
                        <input name="license_plate" value={form.license_plate ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Mileage</label>
                        <input name="mileage" value={form.mileage ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Purchase Date</label>
                        <input name="purchase_date" value={form.purchase_date ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="date" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Purchase Price</label>
                        <input name="purchase_price" value={form.purchase_price ?? ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" type="number" />
                      </div>
                      
                    </div>
                  </form>
                  
                  {/* Footer with discrete delete button */}
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => onDelete(form)}
                      className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                      title="Delete vehicle"
                    >
                      <span className="sr-only">Delete vehicle</span>
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Unsaved changes confirm dialog */}
      <Transition.Root show={showUnsavedChangesDialog} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowUnsavedChangesDialog(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-40 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative bg-white rounded-lg px-6 py-6 text-left shadow-xl max-w-sm w-full">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Unsaved changes
                  </Dialog.Title>
                  <div className="mb-6">You have unsaved changes. Do you want to save them before closing?</div>
                  <div className="flex gap-2 justify-end">
                    <button className="py-2 px-4 rounded bg-gray-200 text-gray-800 font-bold" onClick={handleDiscardChanges}>
                      Discard
                    </button>
                    <button className="py-2 px-4 rounded bg-blue-600 text-white font-bold" onClick={handleSavePendingChanges}>
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
