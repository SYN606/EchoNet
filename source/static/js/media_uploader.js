// ===============================
// Media Uploader (Snapshots + Audio)
// ===============================

console.log("media_uploader.js loaded");

const canvas = document.getElementById("hiddenCanvas");
const ctx = canvas.getContext("2d");

// Get email from localStorage (fallback if not found)
const userEmail = localStorage.getItem("userEmail") || "demo@example.com";

// Globals
let videoElement = null;
let videoStream = null;
let videoOff = false;

let audioRecorder = null;
let audioChunks = [];
let audioIntervalId = null;
let snapshotIntervalId = null;

/* ===============================
   SNAPSHOT CAPTURE & UPLOAD
   =============================== */
function uploadSnapshot() {
    if (!videoStream || videoOff || document.hidden) return; // skip if no camera or tab not visible
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return;

    // Resize to max 640px width for bandwidth saving
    const targetWidth = 640;
    const scale = targetWidth / videoElement.videoWidth;
    canvas.width = targetWidth;
    canvas.height = Math.round(videoElement.videoHeight * scale);

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Black frame detection
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let blackPixels = 0;
    for (let i = 0; i < frame.length; i += 4) {
        if (frame[i] < 20 && frame[i + 1] < 20 && frame[i + 2] < 20) blackPixels++;
    }
    const blackRatio = blackPixels / (frame.length / 4);
    if (blackRatio > 0.9) {
        console.log("Skipping snapshot (black frame)");
        return;
    }

    // Convert to blob (JPEG for smaller size)
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("email", userEmail);
        formData.append("snapshot", blob, "snapshot.jpg");

        fetch("/upload-snapshot", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (!res.ok) throw new Error("Snapshot upload failed");
                console.log("Snapshot uploaded for", userEmail);
            })
            .catch((err) => console.error("Snapshot error:", err));
    }, "image/jpeg", 0.7); // quality 70%
}

/* ===============================
   AUDIO RECORDING & UPLOAD
   =============================== */
function startAudioRecording() {
    if (audioRecorder) {
        console.warn("Audio recorder already running");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((audioStream) => {
            // Try preferred codec first
            let options = { mimeType: "audio/webm;codecs=opus" };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: "audio/webm" };
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: "" }; // fallback to browser default
            }

            audioRecorder = new MediaRecorder(audioStream, options);

            audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            audioRecorder.onstop = () => {
                if (audioChunks.length === 0) return;

                const blob = new Blob(audioChunks, { type: audioRecorder.mimeType });
                audioChunks = [];

                const formData = new FormData();
                formData.append("email", userEmail);

                // Pick extension based on mime type
                const ext = blob.type.includes("ogg") ? "ogg" : "webm";
                formData.append("audio", blob, `audio.${ext}`);

                fetch("/upload-audio", {
                    method: "POST",
                    body: formData,
                })
                    .then((res) => {
                        if (!res.ok) throw new Error("Audio upload failed");
                        console.log("Audio uploaded for", userEmail, "->", ext, blob.type);
                    })
                    .catch((err) => console.error("Audio error:", err));
            };

            // Restart every 30s (store interval ID for cleanup)
            audioIntervalId = setInterval(() => {
                if (audioRecorder?.state === "recording") {
                    audioRecorder.stop();
                    audioRecorder.start();
                }
            }, 30000);

            audioRecorder.start();
            console.log("Audio recording started for", userEmail, "using", options.mimeType);
        })
        .catch((err) => console.error("Audio permission denied:", err));
}

function stopAudioRecording() {
    if (audioRecorder && audioRecorder.state === "recording") {
        audioRecorder.stop();
    }
    if (audioIntervalId) {
        clearInterval(audioIntervalId);
        audioIntervalId = null;
    }
    audioRecorder = null;
}

/* ===============================
   INIT
   =============================== */
export function initMediaUploader(videoEl, stream, cameraStatusFlag) {
    videoElement = videoEl;
    videoStream = stream;
    videoOff = cameraStatusFlag;

    // Snapshots every 2s (lighter load than 1s)
    if (snapshotIntervalId) clearInterval(snapshotIntervalId);
    snapshotIntervalId = setInterval(uploadSnapshot, 2000);

    // Start audio recording
    startAudioRecording();
}

export function updateCameraStatus(isOff) {
    videoOff = isOff;
}

export function stopMediaUploader() {
    if (snapshotIntervalId) clearInterval(snapshotIntervalId);
    stopAudioRecording();
}
