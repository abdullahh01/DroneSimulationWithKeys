export const recognizeGesture = (predictions) => {
    if (predictions.length > 0) {
      const hand = predictions[0];
      const { landmarks } = hand;
  
      const thumb = landmarks[4];
      const indexFinger = landmarks[8];
      const middleFinger = landmarks[12];
      const ringFinger = landmarks[16];
      const pinky = landmarks[20];
  
      // Determine if each finger is open by comparing the Y positions of the tip and the corresponding knuckle
      const isThumbOpen = thumb[1] < landmarks[3][1];
      const isIndexFingerOpen = indexFinger[1] < landmarks[6][1];
      const isMiddleFingerOpen = middleFinger[1] < landmarks[10][1];
      const isRingFingerOpen = ringFinger[1] < landmarks[14][1];
      const isPinkyOpen = pinky[1] < landmarks[18][1];
  
      // Gesture: Stop (all fingers open)
      if (isThumbOpen && isIndexFingerOpen && isMiddleFingerOpen && isRingFingerOpen && isPinkyOpen) {
        return 'stop';
      }
  
      // Gesture: Up (only index finger open)
      if (isIndexFingerOpen && !isMiddleFingerOpen && !isRingFingerOpen && !isPinkyOpen) {
        return 'up';
      }
  
      // Gesture: Down (index and middle fingers open)
      if (isIndexFingerOpen && isMiddleFingerOpen && !isRingFingerOpen && !isPinkyOpen) {
        return 'down';
      }
  
      // Gesture: Forward (all fingers curled into a fist)
      if (!isThumbOpen && !isIndexFingerOpen && !isMiddleFingerOpen && !isRingFingerOpen && !isPinkyOpen) {
        return 'forward';
      }
  
      // Gesture: Right (only pinky finger open)
      if (isPinkyOpen && !isThumbOpen && !isIndexFingerOpen && !isMiddleFingerOpen && !isRingFingerOpen) {
        return 'right';
      }
  
      // Gesture: Left (thumb open and pointing to the left)
      if (isThumbOpen && !isIndexFingerOpen && !isMiddleFingerOpen && !isRingFingerOpen && !isPinkyOpen && thumb[0] < landmarks[3][0]) {
        return 'left';
      }
  
      // Gesture: Backward (all fingers with 50% curl)
      const isHalfCurled = (fingerTip, fingerDip) => fingerTip[1] > fingerDip[1];
      if (isHalfCurled(thumb, landmarks[3]) && 
          isHalfCurled(indexFinger, landmarks[6]) && 
          isHalfCurled(middleFinger, landmarks[10]) && 
          isHalfCurled(ringFinger, landmarks[14]) && 
          isHalfCurled(pinky, landmarks[18])) {
        return 'backward';
      }
  
      return null;
    }
    return null;
  };
  
  
  

  export const drawHand = (predictions, ctx) => {
    if (!predictions || predictions.length === 0) {
      return; // No hand detected, so return early.
    }
  
    // Gesture recognition
    const gesture = recognizeGesture(predictions);
  
    if (gesture) {
      console.log('Recognized Gesture:', gesture);
    }
  
    // Draw hand landmarks
    predictions.forEach((prediction) => {
      const landmarks = prediction.landmarks;
  
      if (!landmarks || landmarks.length === 0) {
        return; // No landmarks detected, return early.
      }
  
      for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i][0];
        const y = landmarks[i][1];
  
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 3 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });
  };
  