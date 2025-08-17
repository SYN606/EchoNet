import { initMediaUploader, updateCameraStatus } from "./media_uploader.js";

const video = document.getElementById("userVideo");
const avatar = document.getElementById("avatar");
const status = document.getElementById("status");
const muteBtn = document.getElementById("muteBtn");
const micIcon = document.getElementById("micIcon");
const micText = document.getElementById("micText");
const videoBtn = document.getElementById("videoBtn");
const videoIcon = document.getElementById("videoIcon");
const videoText = document.getElementById("videoText");
const leaveBtn = document.getElementById("leaveBtn");
const meetingArea = document.getElementById("meetingArea");
const controls = document.getElementById("controls");

let stream;
let isMuted = false;
let videoOff = false;

let seconds = 0;
const timerEl = document.getElementById("timer");
setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.innerText = `${m}:${s}`;
}, 1000);

function checkIfBlackFrame() {
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let blackPixels = 0;
    const totalPixels = frame.length / 4;
    for (let i = 0; i < frame.length; i += 4) {
        if (frame[i] < 20 && frame[i + 1] < 20 && frame[i + 2] < 20) {
            blackPixels++;
        }
    }
    const blackRatio = blackPixels / totalPixels;
    if (blackRatio > 0.9) {
        video.classList.add("hidden");
        avatar.classList.remove("hidden");
        status.innerText = "Camera blocked";
    }
}

window.onload = function () {
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
            stream = s;
            status.innerText = "Connected. Waiting for others to join...";
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                video.classList.remove("hidden");
                avatar.classList.add("hidden");
                setInterval(checkIfBlackFrame, 2000);
                initMediaUploader(video, stream, videoOff);
                status.innerText = "You are in the meeting";
            };
        })
        .catch(() => {
            status.innerText = "Couldn’t access camera. Please check permissions and try again.";
            video.classList.add("hidden");
            avatar.classList.remove("hidden");
        });
};

muteBtn.onclick = () => {
    if (!stream) return;
    isMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
    micIcon.className = isMuted ? "fa-solid fa-microphone-slash w-5 h-5 mb-1" : "fa-solid fa-microphone w-5 h-5 mb-1";
    micText.innerText = isMuted ? "Unmute" : "Mute";
};

videoBtn.onclick = () => {
    if (!stream) return;
    videoOff = !videoOff;
    stream.getVideoTracks().forEach((track) => (track.enabled = !videoOff));
    if (videoOff) {
        video.classList.add("hidden");
        avatar.classList.remove("hidden");
        videoIcon.className = "fa-solid fa-video-slash w-5 h-5 mb-1";
        videoText.innerText = "Start Video";
    } else {
        video.classList.remove("hidden");
        avatar.classList.add("hidden");
        videoIcon.className = "fa-solid fa-video w-5 h-5 mb-1";
        videoText.innerText = "Stop Video";
    }
    updateCameraStatus(videoOff);
};

leaveBtn.onclick = () => {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
    meetingArea.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center">
      <i class="fa-solid fa-phone-slash w-12 h-12 text-red-500 mb-4"></i>
      <h2 class="text-xl font-semibold">You left the meeting</h2>
      <p class="text-gray-400 mt-2">The meeting has ended.</p>
    </div>
  `;
    controls.remove();
};
