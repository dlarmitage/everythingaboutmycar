import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { decodeVin } from '../utils/vinDecode';
import type { DecodedVin } from '../utils/vinDecode';
import BarcodeScanner from 'react-qr-barcode-scanner';

interface VehicleModalProps {
  open: boolean;
  onClose: () => void;
  onAddVehicle: (vehicle: DecodedVin & { vin: string }) => void;
}

export default function VehicleModal({ open, onClose, onAddVehicle }: VehicleModalProps) {
  const [vin, setVin] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [decoded, setDecoded] = useState<DecodedVin | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleVinLookup = async (vinOverride?: string) => {
    const vinToLookup = vinOverride || vin;
    setVin(vinToLookup);
    setVinLoading(true);
    setVinError('');
    setDecoded(null);
    try {
      const data = await decodeVin(vinToLookup);
      if (data && data.make && data.model && data.year) {
        setDecoded(data);
      } else {
        setVinError('Could not decode this VIN. Please check and try again.');
      }
    } catch {
      setVinError('Failed to look up VIN.');
    } finally {
      setVinLoading(false);
    }
  };

  const handleBarcodeScan = () => {
    setScanning(true);
  };

  // react-qr-barcode-scanner passes (result: Result | undefined, error?: any)
  const handleBarcodeDetected = (result: any, error?: any) => {
    // result is an instance of Result from zxing library
    const vinText = result?.getText ? result.getText() : undefined;
    if (vinText) {
      setScanning(false);
      setVin(vinText);
      handleVinLookup(vinText);
    }
  };

  const handleSave = () => {
    if (decoded) {
      // Pass decoded vehicle with VIN to parent
      (typeof window !== 'undefined' && window as any).gtag?.('event', 'add_vehicle'); // Example analytics
      onAddVehicle({ ...decoded, vin }); // body_class is now included if present in decoded
    }
    onClose();
  };

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
                <Dialog.Panel className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all w-full max-w-md">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Add Vehicle
                  </Dialog.Title>
                  <div className="flex flex-col gap-4">
                    <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleVinLookup(); }}>
                      <input
                        type="text"
                        className="border rounded px-3 py-2 text-lg"
                        placeholder="Enter VIN"
                        value={vin}
                        onChange={e => setVin(e.target.value)}
                        maxLength={17}
                        required
                        autoFocus
                      />
                      {vinError && <div className="text-red-500 text-xs">{vinError}</div>}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded bg-blue-600 text-white font-bold disabled:opacity-60"
                          disabled={vinLoading || vin.length < 17}
                        >
                          {vinLoading ? 'Looking up...' : 'Decode VIN'}
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-2 rounded bg-gray-200 text-gray-800 font-bold"
                          onClick={handleBarcodeScan}
                        >
                          Scan Barcode
                        </button>
                      </div>
                    </form>
                    {decoded && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mt-2">
                        <div className="font-bold text-base mb-1">{decoded.year} {decoded.make} {decoded.model}</div>
                        <div className="text-gray-500 text-sm mb-1">
                          {decoded.body_class || ''}
                        </div>
                        <div className="text-xs text-gray-400 break-all">VIN: {vin}</div>
                        <button
                          className="w-full mt-3 py-2 rounded bg-blue-600 text-white font-bold"
                          onClick={handleSave}
                        >
                          Save Vehicle
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="text-blue-600 font-bold">Cancel</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Barcode Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white rounded-lg p-4 w-full max-w-xs flex flex-col items-center">
            <div className="font-bold mb-2">Scan VIN Barcode</div>
            <BarcodeScanner
              width={250}
              height={250}
              onUpdate={handleBarcodeDetected}
            />
            <button
              className="mt-4 px-4 py-2 rounded bg-gray-200 text-gray-800 font-bold"
              onClick={() => setScanning(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
