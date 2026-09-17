import AvatarCanvas from "./components/AvatarCanvas";
import AvatarModeSwitcher from "./components/AvatarModeSwitcher";
import AvatarStatus from "./components/AvatarStatus";
import ConversationStatus from "./components/ConversationStatus";
import FacialDebugger from "./components/FacialDebugger";
import PerformanceMonitor from "./components/PerformanceMonitor";
import SystemDiagnostics from "./components/SystemDiagnostics";
import TrackingControls from "./components/TrackingControls";
import WebcamTracker from "./components/WebcamTracker";
import ConversationPanel from "./components/ConversationPanel";

function App() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      {/* 3D Avatar */}
      <div className="absolute inset-0">
        <AvatarCanvas />
      </div>

      {/* Header */}
      <header
        className="
          pointer-events-none
          absolute
          left-5
          top-5
          z-30
          sm:left-6
          sm:top-6
        "
      >
        <h1
          className="
            text-xl
            font-semibold
            text-white
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
      </header>

      {/* Mode */}
      <AvatarModeSwitcher />

      {/* ConversationStatus*/}
      <ConversationStatus />

      {/* Left controls */}
      <TrackingControls />

      {/* Right system panels */}
      <AvatarStatus />

      <SystemDiagnostics />

      {/* Webcam */}
      <WebcamTracker />

      {/* Facial debugging */}
      <FacialDebugger />

      {/* Performance */}
      <PerformanceMonitor />

      {/* <ConversationPanel /> */}
      <ConversationPanel />

      {/* Footer */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-4
          right-5
          z-20
          hidden
          rounded-full
          border
          border-zinc-700
          bg-zinc-900/80
          px-4
          py-2
          text-xs
          text-zinc-300
          backdrop-blur
          sm:block
        "
      >
        Three.js • WebGL • MediaPipe • 52 Blendshapes
      </div>
    </main>
  );
}

export default App;
