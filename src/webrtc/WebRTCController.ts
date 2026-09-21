export type WebRTCStatus =
  "idle" | "connecting" | "connected" | "disconnected" | "failed" | "error";

interface WebRTCEvents {
  onStatusChange?: (status: WebRTCStatus) => void;
  onDataMessage?: (data: unknown) => void;
}

export class WebRTCController {
  private sender: RTCPeerConnection | null = null;
  private receiver: RTCPeerConnection | null = null;

  private senderDataChannel: RTCDataChannel | null = null;
  private receiverDataChannel: RTCDataChannel | null = null;

  private sourceStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private events: WebRTCEvents;

  constructor(events: WebRTCEvents = {}) {
    this.events = events;
  }

  private setStatus(status: WebRTCStatus) {
    console.log(`[WebRTC] ${status}`);
    this.events.onStatusChange?.(status);
  }

  private waitForIceGatheringComplete(peer: RTCPeerConnection): Promise<void> {
    if (peer.iceGatheringState === "complete") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkState = () => {
        if (peer.iceGatheringState === "complete") {
          peer.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }
      };

      peer.addEventListener("icegatheringstatechange", checkState);

      setTimeout(() => {
        peer.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }, 5000);
    });
  }

  async start(canvas: HTMLCanvasElement): Promise<MediaStream> {
    if (this.sender || this.receiver) {
      throw new Error("WebRTC session is already active");
    }

    if (!canvas.captureStream) {
      throw new Error(
        "Canvas captureStream() is not supported by this browser",
      );
    }

    this.setStatus("connecting");

    try {
      this.remoteStream = new MediaStream();

      this.sender = new RTCPeerConnection({
        iceServers: [],
      });

      this.receiver = new RTCPeerConnection({
        iceServers: [],
      });

      this.sourceStream = canvas.captureStream(30);

      console.log("[WebRTC] Captured canvas stream at 30 FPS");

      for (const track of this.sourceStream.getTracks()) {
        this.sender.addTrack(track, this.sourceStream);
      }

      this.receiver.ontrack = (event) => {
        console.log("[WebRTC] Remote track received");

        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }

        if (!this.remoteStream.getTrackById(event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      };

      this.sender.onconnectionstatechange = () => {
        const state = this.sender?.connectionState;

        console.log("[WebRTC] Sender connection state:", state);

        if (state === "connected") {
          this.setStatus("connected");
        } else if (state === "disconnected") {
          this.setStatus("disconnected");
        } else if (state === "failed") {
          this.setStatus("failed");
        }
      };

      /*
       * DataChannel
       */

      this.senderDataChannel = this.sender.createDataChannel("avatar-state", {
        ordered: true,
      });

      this.senderDataChannel.onopen = () => {
        console.log("[WebRTC] DataChannel OPEN");
      };

      this.senderDataChannel.onclose = () => {
        console.log("[WebRTC] DataChannel CLOSED");
      };

      this.receiver.ondatachannel = (event) => {
        this.receiverDataChannel = event.channel;

        console.log(
          "[WebRTC] Remote DataChannel received:",
          event.channel.label,
        );

        this.receiverDataChannel.onmessage = (messageEvent) => {
          try {
            const data = JSON.parse(messageEvent.data);

            console.log("[WebRTC] Data received:", data);

            this.events.onDataMessage?.(data);
          } catch {
            console.log("[WebRTC] Raw Data:", messageEvent.data);

            this.events.onDataMessage?.(messageEvent.data);
          }
        };
      };

      /*
       * Offer
       */

      const offer = await this.sender.createOffer();

      await this.sender.setLocalDescription(offer);

      await this.waitForIceGatheringComplete(this.sender);

      const localOffer = this.sender.localDescription;

      if (!localOffer) {
        throw new Error("Failed to create local WebRTC offer");
      }

      await this.receiver.setRemoteDescription(localOffer);

      /*
       * Answer
       */

      const answer = await this.receiver.createAnswer();

      await this.receiver.setLocalDescription(answer);

      await this.waitForIceGatheringComplete(this.receiver);

      const localAnswer = this.receiver.localDescription;

      if (!localAnswer) {
        throw new Error("Failed to create WebRTC answer");
      }

      await this.sender.setRemoteDescription(localAnswer);

      console.log("[WebRTC] Offer/Answer completed");

      return this.remoteStream;
    } catch (error) {
      console.error("[WebRTC] Failed:", error);

      this.setStatus("error");

      await this.stop();

      throw error;
    }
  }

  sendJSON(data: unknown) {
    if (
      !this.senderDataChannel ||
      this.senderDataChannel.readyState !== "open"
    ) {
      return;
    }

    this.senderDataChannel.send(JSON.stringify(data));
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async stop() {
    console.log("[WebRTC] Stopping");

    this.sourceStream?.getTracks().forEach((track) => track.stop());

    this.remoteStream?.getTracks().forEach((track) => track.stop());

    this.senderDataChannel?.close();
    this.receiverDataChannel?.close();

    this.sender?.getSenders().forEach((sender) => {
      sender.track?.stop();
    });

    this.sender?.close();
    this.receiver?.close();

    this.sender = null;
    this.receiver = null;

    this.senderDataChannel = null;
    this.receiverDataChannel = null;

    this.sourceStream = null;
    this.remoteStream = null;

    this.setStatus("idle");
  }
}
