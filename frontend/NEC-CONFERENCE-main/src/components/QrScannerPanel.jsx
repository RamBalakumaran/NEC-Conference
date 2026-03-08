import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QrCode, Camera, Play, Square, RefreshCcw, Loader2 } from 'lucide-react';

const QR_REGION_ID = 'admin-qr-reader';

const QrScannerPanel = () => {
  const qrScannerRef = useRef(null);
  const lastScanRef = useRef(null);
  const scanInFlightRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [qrPayload, setQrPayload] = useState('');
  const [cameraList, setCameraList] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const fileInputRef = useRef(null);

  const stopQrScanner = () => {
    if (!qrScannerRef.current) {
      setIsScanning(false);
      return Promise.resolve();
    }
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;
    setIsScanning(false);
    return scanner
      .stop()
      .then(() => scanner.clear())
      .catch(() => {});
  };

  const handleQrLookup = async (payload) => {
    const text = String(payload || '').trim();
    if (!text) return;
    setLookupLoading(true);
    setScanError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        'http://localhost:5200/conference/api/admin/qr/verify',
        { qrText: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScanResult(res.data || null);
      setQrPayload(text);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to verify QR';
      setScanError(message);
      setScanResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const startQrScanner = async () => {
    if (isScanning) return;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setScanError('Camera access requires HTTPS or localhost.');
      return;
    }
    setScanError(null);
    setScanResult(null);
    lastScanRef.current = null;

    const target = document.getElementById(QR_REGION_ID);
    if (!target) {
      setScanError('Scanner region not ready. Please retry.');
      return;
    }

    await stopQrScanner();

    const scanner = new Html5Qrcode(QR_REGION_ID);
    qrScannerRef.current = scanner;
    try {
      const regionSize = Math.min(target.clientWidth || 300, target.clientHeight || 300);
      const boxSize = Math.max(240, Math.min(360, Math.floor(regionSize * 0.8)));

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } };

      await scanner.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: boxSize, height: boxSize },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        },
        async (decodedText) => {
          if (!decodedText) return;
          const now = Date.now();
          if (
            lastScanRef.current &&
            lastScanRef.current.text === decodedText &&
            now - lastScanRef.current.time < 3000
          ) {
            return;
          }
          if (scanInFlightRef.current) return;

          scanInFlightRef.current = true;
          lastScanRef.current = { text: decodedText, time: now };

          try {
            if (scanner.pause) {
              scanner.pause(true);
            }
            await handleQrLookup(decodedText);
          } finally {
            scanInFlightRef.current = false;
            if (scanner.resume) {
              scanner.resume();
            }
          }
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      const message =
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow access in browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera device found.'
          : err?.message || 'Unable to access camera';
      setScanError(message);
      setIsScanning(false);
      qrScannerRef.current = null;
    }
  };

  const handleScanFromImage = async (file) => {
    if (!file) return;
    setScanError(null);
    setScanResult(null);
    setLookupLoading(true);
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      const decodedText = await scanner.scanFile(file, true);
      try {
        await scanner.clear();
      } catch {
        // ignore cleanup errors
      }
      await handleQrLookup(decodedText);
    } catch (err) {
      const message = err?.message || 'Unable to decode QR from image';
      setScanError(message);
    } finally {
      setLookupLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const cams = await Html5Qrcode.getCameras();
        setCameraList(cams || []);
        if (cams && cams.length > 0) {
          setSelectedCameraId((prev) => prev || cams[0].id);
        }
      } catch (err) {
        setCameraList([]);
      }
    };
    loadCameras();
    return () => {
      stopQrScanner();
    };
  }, []);

  const qrParticipant = scanResult?.participant || {};
  const qrPayment = scanResult?.payment || {};
  const qrEvents = Array.isArray(scanResult?.events) ? scanResult.events : [];
  const qrRegistration = scanResult?.registration || null;
  const qrSources = scanResult?.sources || {};

  return (
    <div className="relative z-10 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="text-purple-300" size={22} />
            <h3 className="text-lg font-bold">QR Code Scanner</h3>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[360px] aspect-square">
              <div
                id={QR_REGION_ID}
                className="w-full h-full rounded-2xl border border-purple-500/30 bg-[#0b0513] shadow-inner"
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-purple-300 pointer-events-none">
                  Camera preview will appear here
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={startQrScanner}
              disabled={isScanning}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow-lg text-sm"
            >
              <Play size={16} /> Start Scanning
            </button>
            <button
              onClick={stopQrScanner}
              disabled={!isScanning}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow-lg text-sm"
            >
              <Square size={16} /> Stop Scanning
            </button>
            <button
              onClick={() => handleQrLookup(qrPayload)}
              disabled={!qrPayload || lookupLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow-lg text-sm"
            >
              <RefreshCcw size={16} /> Re-Verify
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg text-sm"
            >
              <QrCode size={16} /> Scan Image
            </button>
          </div>

          {cameraList.length > 0 && (
            <div className="mt-4">
              <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">
                Camera Source
              </label>
              <select
                className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
              >
                {cameraList.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scanError && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {scanError}
            </div>
          )}

          <div className="mt-6">
            <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">
              QR Payload (Auto-filled From Scan)
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-pink-500 text-xs"
              placeholder="If scanning is not available, paste the QR JSON text from the email here..."
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Payload means the raw JSON text encoded inside the QR code.
            </p>
            <button
              onClick={() => handleQrLookup(qrPayload)}
              disabled={!qrPayload || lookupLoading}
              className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow-lg text-sm"
            >
              <QrCode size={16} /> Verify Payload
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleScanFromImage(e.target.files?.[0])}
          />
        </div>

        <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="text-green-300" size={22} />
            <h3 className="text-lg font-bold">Verification Result</h3>
          </div>

          {lookupLoading && (
            <div className="flex items-center gap-2 text-purple-300 text-sm">
              <Loader2 className="animate-spin" size={16} />
              Verifying QR details...
            </div>
          )}

          {!lookupLoading && !scanResult && (
            <div className="text-sm text-gray-400">
              Scan a QR code or paste the payload to view participant, event, and payment details.
            </div>
          )}

          {!lookupLoading && scanResult && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0412] border border-purple-500/20 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Participant</p>
                  <div className="text-sm text-white space-y-1">
                    <div><span className="text-gray-400">Name:</span> {qrParticipant.name || '-'}</div>
                    <div><span className="text-gray-400">PID:</span> {qrParticipant.participantId || '-'}</div>
                    <div><span className="text-gray-400">Email:</span> {qrParticipant.email || '-'}</div>
                    <div><span className="text-gray-400">Phone:</span> {qrParticipant.phone || '-'}</div>
                    <div><span className="text-gray-400">Dept:</span> {qrParticipant.department || '-'}</div>
                    <div><span className="text-gray-400">Year:</span> {qrParticipant.year || '-'}</div>
                    <div><span className="text-gray-400">College:</span> {qrParticipant.college || '-'}</div>
                  </div>
                </div>

                <div className="bg-[#0a0412] border border-purple-500/20 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Payment</p>
                  <div className="text-sm text-white space-y-1">
                    <div><span className="text-gray-400">Status:</span> {qrPayment.status || '-'}</div>
                    <div><span className="text-gray-400">Amount:</span> {qrPayment.currency || 'INR'} {qrPayment.amount || 0}</div>
                    <div><span className="text-gray-400">Order ID:</span> {qrPayment.orderId || '-'}</div>
                    <div><span className="text-gray-400">Payment ID:</span> {qrPayment.paymentId || '-'}</div>
                    <div><span className="text-gray-400">Transaction ID:</span> {qrPayment.transactionId || '-'}</div>
                    <div><span className="text-gray-400">UPI:</span> {qrPayment.upiId || '-'}</div>
                    <div><span className="text-gray-400">Date:</span> {qrPayment.paymentDate ? new Date(qrPayment.paymentDate).toLocaleString() : '-'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0412] border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-purple-300 mb-3">Events</p>
                <div className="flex flex-wrap gap-2">
                  {qrEvents.length > 0 ? (
                    qrEvents.map((ev, idx) => (
                      <span key={`${ev}-${idx}`} className="bg-purple-600/20 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-full text-xs">
                        {ev}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No event data available.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0412] border border-purple-500/20 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Registration</p>
                  <div className="text-sm text-white space-y-1">
                    <div><span className="text-gray-400">Registration ID:</span> {qrRegistration?.id || '-'}</div>
                    <div><span className="text-gray-400">Status:</span> {qrRegistration?.status || '-'}</div>
                    <div><span className="text-gray-400">Registered On:</span> {qrRegistration?.registeredOn ? new Date(qrRegistration.registeredOn).toLocaleString() : '-'}</div>
                  </div>
                </div>

                <div className="bg-[#0a0412] border border-purple-500/20 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-2">Source</p>
                  <div className="text-sm text-white space-y-1">
                    <div><span className="text-gray-400">User:</span> {qrSources.user || '-'}</div>
                    <div><span className="text-gray-400">Registration:</span> {qrSources.registration || '-'}</div>
                    <div><span className="text-gray-400">Payment:</span> {qrSources.payment || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScannerPanel;
