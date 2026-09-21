import { useEffect, useState } from "react";

import { useAvatarStore } from "../store/avatarStore";

export default function TrackingControls() {
  const headPose = useAvatarStore((state) => state.headPose);

  const [trackingActive, setTrackingActive] = useState(false);

  const [calibrated, setCalibrated] = useState(false);

  // ==================================================
  // Poll controller state
  // ==================================================

  useEffect(() => {
    const updateStatus = () => {
      setTrackingActive(Boolean(headPose?.isTrackingActive()));

      setCalibrated(Boolean(headPose?.isCalibrated()));
    };

    updateStatus();

    const interval = window.setInterval(updateStatus, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [headPose]);

  // ==================================================
  // Calibrate
  // ==================================================

  const handleCalibrate = () => {
    if (!headPose) {
      return;
    }

    headPose.calibrate();

    setCalibrated(headPose.isCalibrated());
  };

  // ==================================================
  // Reset
  // ==================================================

  const handleReset = () => {
    if (!headPose) {
      return;
    }

    headPose.reset();

    setCalibrated(false);

    setTrackingActive(false);
  };

  return (
    <aside
      className="
    w-full
    rounded-xl
    border
    border-white/10
    bg-black/80
    p-3
    text-white
    shadow-xl
    backdrop-blur-xl
  "
    >
      {/* ==================================================
          Header
          ================================================== */}

      <div className="mb-3">
        <div
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-wider
            text-zinc-400
          "
        >
          Tracking
        </div>

        <div className="mt-1 text-xs text-zinc-200">Head pose controls</div>
      </div>

      {/* ==================================================
          Tracking status
          ================================================== */}

      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          rounded-lg
          border
          border-white/10
          bg-zinc-900/80
          px-2
          py-2
        "
      >
        <span
          className="
            text-[10px]
            text-zinc-500
          "
        >
          Tracking
        </span>

        <span
          className={`
            text-[10px]
            font-semibold
            ${trackingActive ? "text-emerald-400" : "text-zinc-500"}
          `}
        >
          {trackingActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* ==================================================
          Calibration status
          ================================================== */}

      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          rounded-lg
          border
          border-white/10
          bg-zinc-900/80
          px-2
          py-2
        "
      >
        <span
          className="
            text-[10px]
            text-zinc-500
          "
        >
          Calibration
        </span>

        <span
          className={`
            text-[10px]
            font-semibold
            ${calibrated ? "text-emerald-400" : "text-amber-400"}
          `}
        >
          {calibrated ? "READY" : "NOT SET"}
        </span>
      </div>

      {/* ==================================================
          Buttons
          ================================================== */}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCalibrate}
          disabled={!headPose}
          className="
            flex-1
            rounded-lg
            bg-white
            px-2
            py-2
            text-[10px]
            font-semibold
            text-black
            transition
            hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          Calibrate
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={!headPose}
          className="
            flex-1
            rounded-lg
            border
            border-white/10
            bg-zinc-900
            px-2
            py-2
            text-[10px]
            text-zinc-300
            transition
            hover:bg-zinc-800
            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          Reset
        </button>
      </div>

      {/* ==================================================
          Help text
          ================================================== */}

      <p
        className="
          mt-3
          text-[9px]
          leading-relaxed
          text-zinc-600
        "
      >
        Center your face and click Calibrate to establish the neutral head pose.
      </p>
    </aside>
  );
}
