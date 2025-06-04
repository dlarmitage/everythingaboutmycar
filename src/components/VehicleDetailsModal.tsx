import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
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
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Keep form in sync with vehicle prop
  useEffect(() => {
    setForm(vehicle);
    setDirty(false);
  }, [vehicle, open]);

  // Track edits
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setDirty(true);
  };

  // Handle Save
  const handleSave = () => {
    if (form) {
      onSave(form);
      setDirty(false);
    }
  };

  // Handle Cancel/Close
  const handleCancel = () => {
    if (dirty) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  // Confirm discard edits
  const confirmClose = () => {
    setConfirmDiscard(false);
    setDirty(false);
    onClose();
  };

  if (!form) return null;

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCancel}>
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
                  {/* Close X */}
                  <button
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
                    onClick={handleCancel}
                    aria-label="Close"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Vehicle Details
                  </Dialog.Title>
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
                  <div className="flex justify-between gap-2 mt-6">
                    <button
                      className="flex-1 py-2 rounded bg-blue-600 text-white font-bold disabled:opacity-60"
                      onClick={handleSave}
                      disabled={!dirty}
                    >
                      Save
                    </button>
                    <button
                      className="flex-1 py-2 rounded bg-gray-200 text-gray-800 font-bold"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-2 rounded bg-red-600 text-white font-bold"
                      onClick={() => onDelete(form)}
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Discard edits confirm dialog */}
      <Transition.Root show={confirmDiscard} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setConfirmDiscard(false)}>
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
                    Discard changes?
                  </Dialog.Title>
                  <div className="mb-6">You have unsaved changes. Are you sure you want to discard them?</div>
                  <div className="flex gap-2 justify-end">
                    <button className="py-2 px-4 rounded bg-gray-200 text-gray-800 font-bold" onClick={() => setConfirmDiscard(false)}>
                      Keep Editing
                    </button>
                    <button className="py-2 px-4 rounded bg-red-600 text-white font-bold" onClick={confirmClose}>
                      Discard
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
