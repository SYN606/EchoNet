// Handles snapshots + audio logging to the Flask backend

console.log("media_uploader.js loaded");

const canvas = document.getElementById("hiddenCanvas");
const ctx = canvas.getContext("2d");

// Get email from localStorage (fallback if not found)
const userEmail = localStorage.getItem("userEmail") || "demo@example.com";

// Globals
let videoElement = null;
let videoStream = null;
let videoOff = false;

let audioRecorder;
let audioChunks = [];

/* ===============================
   SNAPSHOT CAPTURE & UPLOAD
   =============================== */
function uploadSnapshot() {
    if (!videoStream || videoOff) return; // only when camera is ON

    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return;
    }

    // Draw current video frame
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Black frame detection
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let blackPixels = 0;
    for (let i = 0; i < frame.length; i += 4) {
        if (frame[i] < 20 && frame[i + 1] < 20 && frame[i + 2] < 20) {
            blackPixels++;
        }
    }
    const blackRatio = blackPixels / (frame.length / 4);
    if (blackRatio > 0.9) {
        console.log("Skipping snapshot (black frame)");
        return;
    }

    // Convert to blob and upload
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("email", userEmail);
        formData.append("snapshot", blob, "snapshot.png");

        fetch("/upload-snapshot", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (!res.ok) throw new Error("Snapshot upload failed");
                console.log("Snapshot uploaded for", userEmail);
            })
            .catch((err) => console.error("Snapshot error:", err));
    }, "image/png");
}

/* ===============================
   AUDIO RECORDING & UPLOAD
   =============================== */
function startAudioRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((audioStream) => {
            audioRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });

            audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            audioRecorder.onstop = () => {
                if (audioChunks.length === 0) return;

                const blob = new Blob(audioChunks, { type: "audio/webm" });
                audioChunks = [];

                const formData = new FormData();
                formData.append("email", userEmail);
                formData.append("audio", blob, "audio.webm");

                fetch("/upload-audio", {
                    method: "POST",
                    body: formData,
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("Audio upload failed");
                        console.log("Audio uploaded for", userEmail);
                    })
                    .catch((err) => console.error("Audio error:", err));
            };

            // Restart every 30s
            setInterval(() => {
                if (audioRecorder.state === "recording") {
                    audioRecorder.stop();
                    audioRecorder.start();
                }
            }, 30000);

            audioRecorder.start();
            console.log("Audio recording started for", userEmail);
        })
        .catch((err) => console.error("Audio permission denied:", err));
}

/* ===============================
   INIT
   =============================== */
export function initMediaUploader(videoEl, stream, cameraStatusFlag) {
    videoElement = videoEl;
    videoStream = stream;
    videoOff = cameraStatusFlag;

    // Snapshots every 1s
    setInterval(uploadSnapshot, 1000);

    // Start audio recording
    startAudioRecording();
}

export function updateCameraStatus(isOff) {
    videoOff = isOff;
}
