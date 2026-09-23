import {
  useCallback,
  useState,
} from "react";

import AvatarCanvas from "./components/AvatarCanvas";
import AvatarModeSwitcher from "./components/AvatarModeSwitcher";
import AvatarStatus from "./components/AvatarStatus";
import ConversationStatus from "./components/ConversationStatus";
import ConversationPanel from "./components/ConversationPanel";
import FacialDebugger from "./components/FacialDebugger";
import PerformanceMonitor from "./components/PerformanceMonitor";
import SystemDiagnostics from "./components/SystemDiagnostics";
import TrackingControls from "./components/TrackingControls";
import WebcamTracker from "./components/WebcamTracker";
import WebRTCPanel from "./components/WebRTCPanel";

import {
  useAvatarStore,
} from "./store/avatarStore";

type WebRTCRole =
  | "host"
  | "viewer"
  | null;

function App() {
  /*
   * ============================================================
   * AVATAR MODE
   * ============================================================
   */

  const mode =
    useAvatarStore(
      (state) => state.mode
    );

  /*
   * ============================================================
   * AVATAR CANVAS
   * ============================================================
   */

  const [
    avatarCanvas,
    setAvatarCanvas,
  ] = useState<HTMLCanvasElement | null>(
    null
  );

  /*
   * ============================================================
   * WEBRTC ROLE
   * ============================================================
   */

  const [
    webRTCRole,
    setWebRTCRole,
  ] = useState<WebRTCRole>(
    null
  );

  /*
   * ============================================================
   * CANVAS READY
   * ============================================================
   */

  const handleCanvasReady =
    useCallback(
      (
        canvas: HTMLCanvasElement | null
      ) => {
        console.log(
          "[App] Avatar canvas:",
          canvas
            ? "READY"
            : "RELEASED"
        );

        setAvatarCanvas(
          canvas
        );
      },
      []
    );

  /*
   * ============================================================
   * CAMERA ENABLE RULE
   *
   * Camera + MediaPipe run ONLY for:
   *
   *     LIVE + HOST
   *
   * Viewer:
   *
   *     Camera OFF
   *     MediaPipe OFF
   * ============================================================
   */

  const webcamEnabled =
    webRTCRole === "host" &&
    mode === "live";

  /*
   * Debug information.
   */

  console.log(
    "[App] mode:",
    mode,
    "WebRTC role:",
    webRTCRole,
    "webcamEnabled:",
    webcamEnabled
  );

  return (
    <main
      className="
        h-dvh
        w-full
        overflow-x-hidden
        overflow-y-auto
        bg-black
        text-white

        lg:overflow-hidden
      "
    >
      <div
        className="
          grid
          min-h-full
          w-full
          grid-cols-1

          lg:h-full
          lg:min-h-0
          lg:grid-cols-[190px_minmax(0,1fr)_280px]

          xl:grid-cols-[220px_minmax(0,1fr)_320px]

          2xl:grid-cols-[240px_minmax(0,1fr)_360px]
        "
      >
        {/* ======================================================
            LEFT COLUMN
        ======================================================= */}

        <section
          className="
            flex
            min-w-0
            min-h-0
            flex-col
            gap-3

            border-r
            border-white/10

            bg-black

            p-3

            lg:overflow-y-auto

            xl:p-4
          "
        >
          {/* Tracking Controls */}

          <div className="shrink-0">
            <TrackingControls />
          </div>

          {/* ==================================================
              HOST CAMERA
          =================================================== */}

          {webcamEnabled && (
            <div className="shrink-0">
              <WebcamTracker
                enabled={true}
              />
            </div>
          )}

          {/* Performance */}

          <div className="shrink-0">
            <PerformanceMonitor />
          </div>
        </section>

        {/* ======================================================
            CENTER COLUMN
        ======================================================= */}

        <section
          className="
            flex
            min-w-0
            min-h-0
            flex-col

            bg-black

            p-3

            sm:p-4

            lg:overflow-hidden

            xl:p-5
          "
        >
          {/* ==================================================
              HEADER
          =================================================== */}

          <div
            className="
              flex
              shrink-0
              flex-wrap
              items-center
              justify-between
              gap-3
              pb-3
            "
          >
            <div className="min-w-0">
              <h1
                className="
                  truncate
                  text-xl
                  font-semibold

                  sm:text-2xl
                "
              >
                Real-Time AI Avatar
              </h1>

              <p
                className="
                  mt-1
                  text-xs
                  text-zinc-400

                  sm:text-sm
                "
              >
                Browser-based conversational avatar
              </p>
            </div>

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              <AvatarModeSwitcher />

              <ConversationStatus />
            </div>
          </div>

          {/* ==================================================
              AVATAR
          =================================================== */}

          <div
            className="
              relative
              min-h-[420px]
              min-w-0
              flex-1
              overflow-hidden

              rounded-2xl

              border
              border-white/10

              bg-black

              lg:min-h-0
            "
          >
            <AvatarCanvas
              onCanvasReady={
                handleCanvasReady
              }
            />
          </div>

          {/* ==================================================
              CONVERSATION
          =================================================== */}

          <div
            className="
              mt-3
              min-w-0
              shrink-0

              lg:max-h-[240px]
            "
          >
            <ConversationPanel />
          </div>
        </section>

        {/* ======================================================
            RIGHT COLUMN
        ======================================================= */}

        <section
          className="
            flex
            min-w-0
            min-h-0
            flex-col
            gap-3

            border-l
            border-white/10

            bg-black

            p-3

            lg:overflow-y-auto

            xl:p-4
          "
        >
          {/* ==================================================
              WEBRTC
              
              IMPORTANT:
              shrink-0 prevents the WebRTC card from being
              compressed to just its header.
          =================================================== */}

          <div className="min-w-0 shrink-0">
            <WebRTCPanel
              canvas={avatarCanvas}
              onRoleChange={
                setWebRTCRole
              }
            />
          </div>

          {/* ==================================================
              FACIAL DEBUGGER
          =================================================== */}

          <div className="min-w-0 shrink-0">
            <FacialDebugger />
          </div>

          {/* ==================================================
              AVATAR STATUS
          =================================================== */}

          <div className="min-w-0 shrink-0">
            <AvatarStatus />
          </div>

          {/* ==================================================
              SYSTEM DIAGNOSTICS
          =================================================== */}

          <div className="min-w-0 shrink-0">
            <SystemDiagnostics />
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;