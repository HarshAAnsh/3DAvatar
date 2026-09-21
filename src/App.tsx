import { useCallback, useState } from "react";

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

function App() {
  const [avatarCanvas, setAvatarCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    console.log("[App] Avatar canvas:", canvas ? "READY" : "RELEASED");

    setAvatarCanvas(canvas);
  }, []);

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
        {/* =========================================================
            LEFT SECTION
            Tracking + Webcam + Performance
        ========================================================== */}

        <section
          className="
            min-w-0
            border-b
            border-zinc-800/80

            lg:min-h-0
            lg:overflow-y-auto
            lg:overscroll-contain
            lg:border-b-0
            lg:border-r

            [scrollbar-width:thin]
          "
        >
          <div
            className="
              flex
              min-h-full
              flex-col
              gap-3
              p-3

              sm:p-4

              xl:p-5
            "
          >
            {/* Tracking */}

            <TrackingControls />

            {/* Webcam */}

            <WebcamTracker />

            {/* Performance */}

            <PerformanceMonitor />
            {/* =====================================================
                AVATAR SYSTEM
            ====================================================== */}

            <AvatarStatus />
          </div>
        </section>

        {/* =========================================================
            CENTER SECTION
            Header + Avatar + Conversation
        ========================================================== */}

        <section
          className="
            min-w-0
            bg-black

            lg:min-h-0
            lg:overflow-hidden
          "
        >
          <div
            className="
              flex
              min-h-0
              flex-col
              gap-3
              p-3

              sm:p-4

              lg:h-full
              lg:p-4

              xl:p-5
            "
          >
            {/* =====================================================
                CENTER HEADER
            ====================================================== */}

            <header
              className="
                grid
                shrink-0
                grid-cols-1
                items-center
                gap-3

                sm:grid-cols-[1fr_auto_auto]

                lg:gap-4
              "
            >
              {/* Title */}

              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    text-lg
                    font-semibold
                    leading-tight

                    sm:text-xl

                    lg:text-2xl
                  "
                >
                  Real-Time AI Avatar
                </h1>

                <p
                  className="
                    mt-1
                    truncate
                    text-[11px]
                    text-zinc-400

                    sm:text-xs

                    lg:text-sm
                  "
                >
                  Browser-based conversational avatar
                </p>
              </div>

              {/* Mode */}

              <div className="justify-self-start sm:justify-self-center">
                <AvatarModeSwitcher />
              </div>

              {/* Conversation Status */}

              <div className="justify-self-start sm:justify-self-end">
                <ConversationStatus />
              </div>
            </header>

            {/* =====================================================
                AVATAR
            ====================================================== */}

            <div
              className="
                min-h-0
                min-w-0
                overflow-hidden
                rounded-2xl
                border
                border-white/5
                bg-black

                h-[55vh]
                min-h-[360px]

                sm:h-[58vh]
                sm:min-h-[420px]

                lg:flex-1
                lg:h-auto
                lg:min-h-0
              "
            >
              <AvatarCanvas onCanvasReady={handleCanvasReady} />
            </div>

            {/* =====================================================
                CONVERSATION
            ====================================================== */}

            <div
              className="
                min-w-0
                shrink-0
              "
            >
              <ConversationPanel />
            </div>
          </div>
        </section>

        {/* =========================================================
            RIGHT SECTION
            WebRTC + Facial Debugger + Diagnostics
        ========================================================== */}

        <section
          className="
            min-w-0
            border-t
            border-zinc-800/80

            lg:min-h-0
            lg:overflow-y-auto
            lg:overscroll-contain
            lg:border-t-0
            lg:border-l

            [scrollbar-width:thin]
          "
        >
          <div
            className="
              flex
              min-h-full
              flex-col
              gap-3
              p-3

              sm:p-4

              xl:p-5
            "
          >
            {/* =====================================================
                WEBRTC
            ====================================================== */}

            <WebRTCPanel canvas={avatarCanvas} />

            {/* =====================================================
                FACIAL DEBUGGER
            ====================================================== */}

            <FacialDebugger />

            {/* =====================================================
                SYSTEM DIAGNOSTICS
            ====================================================== */}

            <SystemDiagnostics />
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
