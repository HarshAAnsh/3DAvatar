import AvatarCanvas from './components/AvatarCanvas'
import FacialDebugger from './components/FacialDebugger'
import WebcamTracker from './components/WebcamTracker'
import TrackingControls from './components/TrackingControls'
import PerformanceMonitor from './components/PerformanceMonitor'
import TTSPanel from './components/TTSPanel'

function App() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <AvatarCanvas />
      </div>

      <header className="pointer-events-none absolute left-5 top-5 z-30 sm:left-6 sm:top-6">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">
          Real-Time AI Avatar
        </h1>

        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
          Browser-based conversational avatar
        </p>
      </header>

      <TrackingControls />

      <WebcamTracker />

      <FacialDebugger />

      <PerformanceMonitor />

      <TTSPanel />

      <div className="pointer-events-none absolute bottom-4 right-5 z-30">
  <div className="
    whitespace-nowrap
    rounded-full
    border
    border-zinc-700
    bg-zinc-900/80
    px-4
    py-2
    text-xs
    text-zinc-300
    backdrop-blur
    sm:px-5
    sm:text-sm
  ">
    Three.js • WebGL • MediaPipe • 52 Blendshapes
  </div>
</div>
    </main>
  )
}

export default App