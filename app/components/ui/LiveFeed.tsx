import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Text, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/hooks/use-firebase';

const MJPEG_URL = 'http://10.10.254.98:5000/video';
const { width, height } = Dimensions.get('window');

interface LiveFeedProps {
  actClose: () => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ actClose }) => {
  const [capturing, setCapturing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleCapture = async () => {
    if (capturing) return;
    
    setCapturing(true);

    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Create a new record in Firestore
      await addDoc(collection(db, 'live_feed'), {
        timestamp: serverTimestamp(),
        imageUrl: MJPEG_URL,
        captured: true,
      });
      
      console.log('Capture saved successfully');
    } catch (error) {
      console.error('Error saving capture:', error);
    } finally {
      setTimeout(() => setCapturing(false), 500);
    }
  };

  return (
    <View style={styles.container}>

      {/* Flash overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* Live feed */}
      <WebView
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                  body { 
                    margin: 0; 
                    padding: 0; 
                    background: #000; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100vh; 
                    overflow: hidden;
                  }
                  img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover; 
                  }
                </style>
              </head>
              <body>
                <img src="${MJPEG_URL}" />
              </body>
            </html>
          `,
        }}
        style={styles.video}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />

      {/* Top status bar with gradient effect */}
      <View style={styles.topBar}>
        <View style={styles.recordingIndicator}>
          <Animated.View 
            style={[
              styles.recordingDot,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text onPress={() => actClose()} style={styles.cross}>X</Text>
      </View>

      {/* Bottom control bar with gradient effect */}
      <View style={styles.controlBar}>
        {/* Spacer for layout balance */}
        <View style={styles.spacer} />

        {/* Capture button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCapture}
          disabled={capturing}
          style={styles.captureButtonContainer}
        >
          <Animated.View
            style={[
              styles.captureButton,
              {
                transform: [{ scale: scaleAnim }],
                opacity: capturing ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.captureButtonInner} />
          </Animated.View>
        </TouchableOpacity>

        {/* Gallery preview placeholder */}
        <View style={styles.spacer}>
          <View style={styles.galleryPreview}>
            <View style={styles.galleryIcon} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 999
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 10,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 50,
    paddingTop: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  spacer: {
    width: 60,
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cross: {
    fontSize: 24,
    color: 'rgb(255, 0, 0)',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  galleryPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});

export default LiveFeed;