import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Updated import
import jsQR from 'jsqr';
import '../App.css'

const Scanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate(); // Updated hook
  let stream=null;  
  useEffect(() => {
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startCamera();
    intervalRef.current = setInterval(scanQRCode, 500);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
        
        stream.getVideoTracks().forEach(track => {
          track.stop(); 
        });
        
        
        stream.getAudioTracks().forEach(track => {
          track.stop();
        });
    
        // Optionally, set the srcObject to null
        const videoElement = document.querySelector('video');
        if (videoElement) {
          videoElement.srcObject = null;
        }
    
        stream = null;
        
  };
}
  const scanQRCode = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            let jsonString = code.data;

            jsonString = jsonString.replace(/shopID:/g, 'shopID":');
            if (!jsonString.startsWith('{')) {
              jsonString = '{' + jsonString;
            }
            if (!jsonString.endsWith('}')) {
              jsonString = jsonString + '}';
            }
            const jsonResult = JSON.parse(jsonString);
            // Redirect to the payments page with the shop data
            navigate('/payment', { state: { qrData: jsonResult } });
            clearInterval(intervalRef.current);
            stopCamera();
          } catch (error) {
            console.error('Failed to parse JSON:', error);
          }
        }
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">QR Code Scanner</h2>
            </div>
            <div className="card-body">
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }}></video>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
