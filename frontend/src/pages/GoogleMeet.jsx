import { useEffect, useRef, useState } from "react";
import { FaVideo } from "react-icons/fa";

export default function GoogleMeet() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [snapshots, setSnapshots] = useState([]);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            } catch (error) {
                console.error("Camera access denied:", error);
            }
        };

        startCamera();

        const captureInterval = setInterval(() => {
            if (!videoRef.current || !canvasRef.current) return;

            const context = canvasRef.current.getContext("2d");
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const imageData = canvasRef.current.toDataURL("image/jpeg");

            setSnapshots((prev) => [...prev, imageData]);
        }, 1000);

        return () => clearInterval(captureInterval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-4">
                <FaVideo className="inline text-4xl text-green-600" />
                <h2 className="text-2xl font-semibold text-gray-700 mt-2">Google Meet (Demo)</h2>
                <p className="text-sm text-gray-500">Webcam access and auto-capturing snapshots</p>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                <video ref={videoRef} className="w-[320px] h-[240px]" autoPlay muted />
                <canvas ref={canvasRef} width="320" height="240" className="hidden" />
            </div>

            <div className="mt-6 w-full max-w-xl grid grid-cols-3 gap-2">
                {snapshots.slice(-9).map((img, i) => (
                    <img
                        key={i}
                        src={img}
                        alt={`Snapshot ${i}`}
                        className="rounded-md border border-gray-300"
                    />
                ))}
            </div>
        </div>
    );
}
