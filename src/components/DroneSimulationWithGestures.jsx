// import React from 'react'

// const DroneSimulationWithGestures = () => {
//   return (
//     <div>DroneSimulationWithGestures</div>
//   )
// }

// export default DroneSimulationWithGestures

import { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';
import { drawHand, recognizeGesture } from '../lib/handGesturesUtils.js';

const DroneSimulationWithGestures = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [gesture, setGesture] = useState('');
  
    useEffect(() => {
      const loadHandposeModel = async () => {
        const net = await handpose.load();
        console.log('Handpose model loaded.');
        setLoading(false);
  
        const interval = setInterval(() => {
          detect(net);
        }, 100); // Run detect every 100 milliseconds
  
        return () => clearInterval(interval);
      };
  
      loadHandposeModel();
    }, []);
  
    const detect = async (net) => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
  
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;
  
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
  
        const hand = await net.estimateHands(video);
  
        if (hand && hand.length > 0) {
          const ctx = canvasRef.current.getContext('2d');
          drawHand(hand, ctx);
  
          const recognizedGesture = recognizeGesture(hand);
          if (recognizedGesture) {
            setGesture(recognizedGesture);
          }
        }
      }
    };
  
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ marginRight: '10px' }}>
          <Webcam
            ref={webcamRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
        <div>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          {loading && <p>Loading model...</p>}
          <h2>Recognized Gesture: {gesture}</h2>
        </div>
      </div>
    );
};

export default DroneSimulationWithGestures;
