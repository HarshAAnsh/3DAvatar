import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAvatarStore } from '../store/avatarStore'

import { TTSController } from '../avatar/TTSController'


export default function TTSPanel() {

  // --------------------------------------------------
  // Zustand
  // --------------------------------------------------

  const speechAnimation =
    useAvatarStore(
      (state) =>
        state.speechAnimation
    )


  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [text, setText] =
    useState(
      'Hello! I am a real-time AI avatar.'
    )

  const [speaking, setSpeaking] =
    useState(false)


  // --------------------------------------------------
  // TTS reference
  // --------------------------------------------------

  const ttsRef =
    useRef<TTSController | null>(
      null
    )


  // --------------------------------------------------
  // Initialize TTS
  // --------------------------------------------------

  useEffect(() => {

    const tts =
      new TTSController({

        // -------------------------------------------
        // Speech started
        // -------------------------------------------

        onStart: () => {

          console.log(
            '[TTSPanel] Speech started'
          )

          speechAnimation?.start()

          setSpeaking(
            true
          )
        },


        // -------------------------------------------
        // Speech ended
        // -------------------------------------------

        onEnd: () => {

          console.log(
            '[TTSPanel] Speech ended'
          )

          speechAnimation?.stop()

          setSpeaking(
            false
          )
        },
      })


    ttsRef.current =
      tts


    // ---------------------------------------------
    // Cleanup
    // ---------------------------------------------

    return () => {

      tts.stop()

      speechAnimation?.stop()

      ttsRef.current =
        null
    }

  }, [
    speechAnimation,
  ])


  // --------------------------------------------------
  // Speak
  // --------------------------------------------------

  const speak = () => {

    const cleanText =
      text.trim()


    if (!cleanText) {
      return
    }


    if (!ttsRef.current) {

      console.warn(
        '[TTSPanel] TTS controller not initialized'
      )

      return
    }


    if (!speechAnimation) {

      console.warn(
        '[TTSPanel] Speech animation not initialized'
      )

      return
    }


    ttsRef.current.speak(
      cleanText
    )
  }


  // --------------------------------------------------
  // Stop
  // --------------------------------------------------

  const stop = () => {

    ttsRef.current?.stop()

    speechAnimation?.stop()

    setSpeaking(
      false
    )
  }


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <aside
      className="
        absolute
        bottom-5
        right-5
        z-30
        w-[min(420px,calc(100vw-2rem))]
        rounded-2xl
        border
        border-white/10
        bg-black/80
        p-4
        shadow-2xl
        backdrop-blur-xl
      "
    >

      {/* ----------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------- */}

      <div className="mb-3">

        <p
          className="
            text-sm
            font-semibold
            text-white
          "
        >
          Avatar Speech
        </p>

        <p
          className="
            mt-1
            text-xs
            text-zinc-400
          "
        >
          Browser-based text-to-speech
        </p>

      </div>


      {/* ----------------------------------------- */}
      {/* Text input */}
      {/* ----------------------------------------- */}

      <textarea
        value={text}

        onChange={(event) =>
          setText(
            event.target.value
          )
        }

        rows={3}

        className="
          w-full
          resize-none
          rounded-lg
          border
          border-white/10
          bg-zinc-900
          p-3
          text-sm
          text-white
          outline-none
          placeholder:text-zinc-600
        "

        placeholder="
          Type something for the avatar to say...
        "
      />


      {/* ----------------------------------------- */}
      {/* Buttons */}
      {/* ----------------------------------------- */}

      <div
        className="
          mt-3
          flex
          gap-2
        "
      >

        {/* Speak */}

        <button
          onClick={speak}

          disabled={
            speaking ||
            !speechAnimation
          }

          className="
            flex-1
            rounded-lg
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-black
            transition
            hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Speak
        </button>


        {/* Stop */}

        <button
          onClick={stop}

          className="
            rounded-lg
            border
            border-white/10
            bg-zinc-900
            px-4
            py-2
            text-sm
            text-white
            transition
            hover:bg-zinc-800
          "
        >
          Stop
        </button>

      </div>


      {/* ----------------------------------------- */}
      {/* Speaking indicator */}
      {/* ----------------------------------------- */}

      {speaking && (

        <div
          className="
            mt-3
            text-center
            text-xs
            text-green-400
          "
        >
          ● AVATAR SPEAKING
        </div>

      )}


      {/* ----------------------------------------- */}
      {/* Initialization status */}
      {/* ----------------------------------------- */}

      {!speechAnimation && (

        <div
          className="
            mt-3
            text-center
            text-xs
            text-yellow-400
          "
        >
          Initializing avatar speech...
        </div>

      )}

    </aside>
  )
}