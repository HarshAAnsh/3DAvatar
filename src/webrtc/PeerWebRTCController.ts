export type PeerConnectionState =
  | "idle"
  | "connecting"
  | "waiting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed"
  | "error";

export type PeerRole =
  | "host"
  | "viewer"
  | null;

interface PeerWebRTCEvents {
  onStatusChange?: (
    status: PeerConnectionState,
  ) => void;

  onRemoteStream?: (
    stream: MediaStream,
  ) => void;

  onDataMessage?: (
    data: unknown,
  ) => void;

  onRoomJoined?: (
    roomId: string,
    peerCount: number,
    role: PeerRole,
  ) => void;

  onPeerReady?: () => void;

  onPeerLeft?: () => void;

  onError?: (
    error: string,
  ) => void;
}

interface SignalingMessage {
  type:
    | "join"
    | "joined"
    | "peer-ready"
    | "offer"
    | "answer"
    | "ice-candidate"
    | "peer-left"
    | "leave"
    | "error";

  roomId?: string;

  peerCount?: number;

  offer?: RTCSessionDescriptionInit;

  answer?: RTCSessionDescriptionInit;

  candidate?: RTCIceCandidateInit;

  message?: string;
}

export class PeerWebRTCController {
  private peer: RTCPeerConnection | null =
    null;

  private socket: WebSocket | null =
    null;

  private localStream: MediaStream | null =
    null;

  private remoteStream: MediaStream | null =
    null;

  private dataChannel: RTCDataChannel | null =
    null;

  private events: PeerWebRTCEvents;

  private roomId: string | null =
    null;

  private role: PeerRole = null;

  private publishCanvas = false;

  private pendingCandidates: RTCIceCandidateInit[] =
    [];

  private joinedPromiseResolve:
    | (() => void)
    | null = null;

  private joinedPromiseReject:
    | ((error: Error) => void)
    | null = null;

  constructor(
    events: PeerWebRTCEvents = {},
  ) {
    this.events = events;
  }

  private setStatus(
    status: PeerConnectionState,
  ) {
    console.log(
      `[WebRTC Peer] ${status}`,
    );

    this.events.onStatusChange?.(
      status,
    );
  }

  getRoomId() {
    return this.roomId;
  }

  getRole() {
    return this.role;
  }

  async connect(
    signalingUrl: string,
    roomId: string,
    publishCanvas: boolean,
    canvas?: HTMLCanvasElement | null,
  ) {
    if (
      this.socket ||
      this.peer
    ) {
      throw new Error(
        "WebRTC peer is already active.",
      );
    }

    const normalizedRoom =
      roomId.trim().toUpperCase();

    if (!normalizedRoom) {
      throw new Error(
        "Room ID is required.",
      );
    }

    /*
     * Set role BEFORE signaling.
     *
     * This removes the previous race where the
     * role was still null while the peer was
     * being initialized.
     */

    this.role = publishCanvas
      ? "host"
      : "viewer";

    this.roomId =
      normalizedRoom;

    this.publishCanvas =
      publishCanvas;

    this.setStatus(
      "connecting",
    );

    try {
      /*
       * Create peer connection FIRST.
       */

      this.createPeerConnection();

      /*
       * Viewer explicitly announces
       * that it wants to receive video.
       */

      if (
        this.role === "viewer"
      ) {
        const peer =
          this.peer as
            | (RTCPeerConnection & {
                addTransceiver: (
                  trackOrKind: string | MediaStreamTrack,
                  init?: RTCRtpTransceiverInit,
                ) => RTCRtpTransceiver;
              })
            | null;

        if (peer) {
          peer.addTransceiver(
            "video",
            {
              direction: "recvonly",
            },
          );

          console.log(
            "[WebRTC Peer] Viewer recvonly transceiver added",
          );
        }
      }

      /*
       * Host publishes the canvas.
       */

      if (
        this.role === "host"
      ) {
        if (!canvas) {
          throw new Error(
            "Avatar canvas is not ready.",
          );
        }

        this.attachCanvasStream(
          canvas,
        );
      }

      /*
       * Connect signaling and WAIT for
       * the server's joined message.
       */

      await this.connectSignaling(
        signalingUrl,
      );

      this.setStatus(
        "waiting",
      );
    } catch (error) {
      console.error(
        "[WebRTC Peer] Connection failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "WebRTC connection failed.";

      this.events.onError?.(
        message,
      );

      await this.disconnect();

      this.setStatus(
        "error",
      );

      throw error;
    }
  }

  private connectSignaling(
    signalingUrl: string,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        const socket =
          new WebSocket(
            signalingUrl,
          );

        this.socket =
          socket;

        let settled = false;

        /*
         * Resolve ONLY after joined.
         */

        this.joinedPromiseResolve =
          () => {
            if (settled) {
              return;
            }

            settled = true;

            this.joinedPromiseResolve =
              null;

            this.joinedPromiseReject =
              null;

            resolve();
          };

        this.joinedPromiseReject =
          (error) => {
            if (settled) {
              return;
            }

            settled = true;

            this.joinedPromiseResolve =
              null;

            this.joinedPromiseReject =
              null;

            reject(error);
          };

        socket.onopen = () => {
          console.log(
            "[Signaling] Connected",
          );

          socket.send(
            JSON.stringify({
              type: "join",
              roomId: this.roomId,
            }),
          );

          console.log(
            "[Signaling] Join sent:",
            this.roomId,
          );
        };

        socket.onmessage =
          (event) => {
            try {
              const message =
                JSON.parse(
                  event.data,
                ) as SignalingMessage;

              void this.handleSignalingMessage(
                message,
              );
            } catch (error) {
              console.error(
                "[Signaling] Invalid message:",
                error,
              );
            }
          };

        socket.onerror = () => {
          const error =
            new Error(
              "Unable to connect to signaling server.",
            );

          this.events.onError?.(
            error.message,
          );

          this.joinedPromiseReject?.(
            error,
          );
        };

        socket.onclose = () => {
          console.log(
            "[Signaling] Disconnected",
          );

          if (!settled) {
            this.joinedPromiseReject?.(
              new Error(
                "Signaling connection closed before joining the room.",
              ),
            );
          }
        };
      },
    );
  }

  private createPeerConnection() {
    this.remoteStream =
      new MediaStream();

    this.peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
          {
            urls:
              "stun:stun.cloudflare.com:3478",
          },
        ],

        iceTransportPolicy:
          "all",
      });

    /*
     * ICE candidates
     */

    this.peer.onicecandidate =
      (event) => {
        if (
          !event.candidate
        ) {
          return;
        }

        console.log(
          "[WebRTC Peer] Local ICE candidate",
        );

        this.sendSignaling({
          type: "ice-candidate",

          candidate:
            event.candidate.toJSON(),
        });
      };

    this.peer.onicecandidateerror =
      (event) => {
        console.warn(
          "[WebRTC Peer] ICE candidate error:",
          event.errorCode,
          event.errorText,
        );
      };

    /*
     * ICE state
     */

    this.peer.oniceconnectionstatechange =
      () => {
        console.log(
          "[WebRTC Peer] ICE connection:",
          this.peer
            ?.iceConnectionState,
        );
      };

    this.peer.onicegatheringstatechange =
      () => {
        console.log(
          "[WebRTC Peer] ICE gathering:",
          this.peer
            ?.iceGatheringState,
        );
      };

    /*
     * Signaling state
     */

    this.peer.onsignalingstatechange =
      () => {
        console.log(
          "[WebRTC Peer] Signaling state:",
          this.peer
            ?.signalingState,
        );
      };

    /*
     * Remote media
     */

    this.peer.ontrack =
      (event) => {
        console.log(
          "[WebRTC Peer] Remote track received:",
          event.track.kind,
        );

        if (
          !this.remoteStream
        ) {
          this.remoteStream =
            new MediaStream();
        }

        const existing =
          this.remoteStream.getTrackById(
            event.track.id,
          );

        if (!existing) {
          this.remoteStream.addTrack(
            event.track,
          );
        }

        this.events.onRemoteStream?.(
          this.remoteStream,
        );

        event.track.onended =
          () => {
            console.log(
              "[WebRTC Peer] Remote track ended",
            );
          };
      };

    /*
     * Connection state
     */

    this.peer.onconnectionstatechange =
      () => {
        const state =
          this.peer
            ?.connectionState;

        console.log(
          "[WebRTC Peer] Connection:",
          state,
        );

        switch (state) {
          case "connected":
            this.setStatus(
              "connected",
            );
            break;

          case "disconnected":
            this.setStatus(
              "disconnected",
            );
            break;

          case "failed":
            this.setStatus(
              "failed",
            );
            break;

          case "closed":
            this.setStatus(
              "closed",
            );
            break;
        }
      };

    /*
     * DataChannel received by viewer
     */

    this.peer.ondatachannel =
      (event) => {
        console.log(
          "[WebRTC Peer] Remote DataChannel:",
          event.channel.label,
        );

        this.dataChannel =
          event.channel;

        this.setupDataChannel(
          this.dataChannel,
        );
      };
  }

  private attachCanvasStream(
    canvas: HTMLCanvasElement,
  ) {
    if (
      !canvas.captureStream
    ) {
      throw new Error(
        "Canvas captureStream() is not supported by this browser.",
      );
    }

    this.localStream =
      canvas.captureStream(
        30,
      );

    console.log(
      "[WebRTC Peer] Canvas captured at 30 FPS",
    );

    for (
      const track of
      this.localStream.getTracks()
    ) {
      console.log(
        "[WebRTC Peer] Adding track:",
        track.kind,
        track.readyState,
      );

      this.peer?.addTrack(
        track,
        this.localStream,
      );
    }

    /*
     * ONLY HOST creates DataChannel.
     */

    this.dataChannel =
      this.peer?.createDataChannel(
        "avatar-state",
        {
          ordered: true,
        },
      ) ?? null;

    if (
      this.dataChannel
    ) {
      this.setupDataChannel(
        this.dataChannel,
      );
    }
  }

  private setupDataChannel(
    channel: RTCDataChannel,
  ) {
    channel.onopen = () => {
      console.log(
        "[WebRTC Peer] DataChannel OPEN",
      );
    };

    channel.onclose = () => {
      console.log(
        "[WebRTC Peer] DataChannel CLOSED",
      );
    };

    channel.onerror = (
      event,
    ) => {
      console.warn(
        "[WebRTC Peer] DataChannel error:",
        event,
      );
    };

    channel.onmessage =
      (event) => {
        try {
          const data =
            JSON.parse(
              event.data,
            );

          this.events.onDataMessage?.(
            data,
          );
        } catch {
          this.events.onDataMessage?.(
            event.data,
          );
        }
      };
  }

  private async handleSignalingMessage(
    message: SignalingMessage,
  ) {
    switch (
      message.type
    ) {
      /*
       * ROOM JOIN
       */

      case "joined": {
        const peerCount =
          message.peerCount ??
          0;

        console.log(
          "[Signaling] Joined room:",
          message.roomId,
          "peers:",
          peerCount,
          "role:",
          this.role,
        );

        this.events.onRoomJoined?.(
          message.roomId ??
            this.roomId ??
            "",
          peerCount,
          this.role,
        );

        this.joinedPromiseResolve?.();

        break;
      }

      /*
       * SECOND PEER ARRIVED
       */

      case "peer-ready": {
        console.log(
          "[Signaling] Peer ready",
        );

        this.events.onPeerReady?.();

        /*
         * ONLY HOST creates offer.
         */

        if (
          this.role === "host"
        ) {
          await this.createOffer();
        }

        break;
      }

      /*
       * HOST OFFER
       */

      case "offer": {
        if (
          !message.offer
        ) {
          return;
        }

        console.log(
          "[WebRTC Peer] Received offer",
        );

        await this.handleOffer(
          message.offer,
        );

        break;
      }

      /*
       * HOST RECEIVES ANSWER
       */

      case "answer": {
        if (
          !message.answer
        ) {
          return;
        }

        console.log(
          "[WebRTC Peer] Received answer",
        );

        await this.handleAnswer(
          message.answer,
        );

        break;
      }

      /*
       * ICE
       */

      case "ice-candidate": {
        if (
          !message.candidate
        ) {
          return;
        }

        await this.handleIceCandidate(
          message.candidate,
        );

        break;
      }

      /*
       * PEER LEFT
       */

      case "peer-left": {
        console.log(
          "[Signaling] Peer left",
        );

        this.events.onPeerLeft?.();

        this.remoteStream =
          new MediaStream();

        this.setStatus(
          "waiting",
        );

        break;
      }

      /*
       * ERROR
       */

      case "error": {
        const error =
          message.message ??
          "Signaling error.";

        console.error(
          "[Signaling]",
          error,
        );

        this.events.onError?.(
          error,
        );

        this.joinedPromiseReject?.(
          new Error(error),
        );

        break;
      }
    }
  }

  private async createOffer() {
    if (
      !this.peer
    ) {
      return;
    }

    /*
     * Prevent duplicate offers.
     */

    if (
      this.peer.signalingState !==
      "stable"
    ) {
      console.log(
        "[WebRTC Peer] Skipping offer; signaling state:",
        this.peer.signalingState,
      );

      return;
    }

    console.log(
      "[WebRTC Peer] Creating offer",
    );

    const offer =
      await this.peer.createOffer();

    await this.peer.setLocalDescription(
      offer,
    );

    console.log(
      "[WebRTC Peer] Local description set",
    );

    this.sendSignaling({
      type: "offer",
      offer:
        this.peer.localDescription ??
        offer,
    });
  }

  private async handleOffer(
    offer: RTCSessionDescriptionInit,
  ) {
    if (
      !this.peer
    ) {
      return;
    }

    console.log(
      "[WebRTC Peer] Setting remote offer",
    );

    await this.peer.setRemoteDescription(
      offer,
    );

    console.log(
      "[WebRTC Peer] Remote offer set",
    );

    await this.flushPendingCandidates();

    const answer =
      await this.peer.createAnswer();

    await this.peer.setLocalDescription(
      answer,
    );

    console.log(
      "[WebRTC Peer] Answer created",
    );

    this.sendSignaling({
      type: "answer",
      answer:
        this.peer.localDescription ??
        answer,
    });
  }

  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
  ) {
    if (
      !this.peer
    ) {
      return;
    }

    console.log(
      "[WebRTC Peer] Setting remote answer",
    );

    await this.peer.setRemoteDescription(
      answer,
    );

    console.log(
      "[WebRTC Peer] Remote answer set",
    );

    await this.flushPendingCandidates();
  }

  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
  ) {
    if (
      !this.peer
    ) {
      return;
    }

    if (
      !this.peer.remoteDescription
    ) {
      console.log(
        "[WebRTC Peer] Queueing ICE candidate",
      );

      this.pendingCandidates.push(
        candidate,
      );

      return;
    }

    try {
      await this.peer.addIceCandidate(
        candidate,
      );

      console.log(
        "[WebRTC Peer] ICE candidate added",
      );
    } catch (error) {
      console.warn(
        "[WebRTC Peer] Failed to add ICE candidate:",
        error,
      );
    }
  }

  private async flushPendingCandidates() {
    if (
      !this.peer
    ) {
      return;
    }

    if (
      this.pendingCandidates.length ===
      0
    ) {
      return;
    }

    console.log(
      "[WebRTC Peer] Flushing ICE candidates:",
      this.pendingCandidates.length,
    );

    for (
      const candidate of
      this.pendingCandidates
    ) {
      try {
        await this.peer.addIceCandidate(
          candidate,
        );
      } catch (error) {
        console.warn(
          "[WebRTC Peer] Pending ICE failed:",
          error,
        );
      }
    }

    this.pendingCandidates = [];
  }

  private sendSignaling(
    message: SignalingMessage,
  ) {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      console.warn(
        "[Signaling] Socket not open:",
        message.type,
      );

      return;
    }

    this.socket.send(
      JSON.stringify(message),
    );
  }

  sendJSON(
    data: unknown,
  ) {
    if (
      !this.dataChannel ||
      this.dataChannel.readyState !==
        "open"
    ) {
      return;
    }

    this.dataChannel.send(
      JSON.stringify(data),
    );
  }

  async disconnect() {
    console.log(
      "[WebRTC Peer] Disconnecting",
    );

    try {
      this.sendSignaling({
        type: "leave",
      });
    } catch {
      // Ignore.
    }

    this.localStream
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop(),
      );

    this.remoteStream
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop(),
      );

    this.dataChannel?.close();

    this.peer?.close();

    this.socket?.close();

    this.localStream =
      null;

    this.remoteStream =
      null;

    this.dataChannel =
      null;

    this.peer =
      null;

    this.socket =
      null;

    this.roomId =
      null;

    this.role =
      null;

    this.publishCanvas =
      false;

    this.pendingCandidates =
      [];

    this.joinedPromiseResolve =
      null;

    this.joinedPromiseReject =
      null;

    this.setStatus(
      "idle",
    );
  }
}