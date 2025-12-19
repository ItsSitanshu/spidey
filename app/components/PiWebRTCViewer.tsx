import React, { useState, useRef, useEffect } from 'react';
import { View, Button, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCPIPView,
  mediaDevices
} from 'react-native-webrtc';
import { io } from 'socket.io-client'; // for signaling

const PI_SIGNALING_SERVER = 'http://10.10.254.98:5000'; // Pi WebSocket/Socket.IO
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function PiWebRTCViewer() {
  const [stream, setStream] = useState(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const viewRef = useRef(0);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
      if (stream) {
        stream.release();
        setStream(null);
      }
    };
  }, []);

  const startStream = async () => {
    const socket = io(PI_SIGNALING_SERVER);

    pc.current = new RTCPeerConnection(configuration);

    pc.current.ontrack = (event: any) => {
      console.log('Received track');
      setStream(event.streams[0]);
    };

    socket.on('offer', async (sdp: any) => {
      console.log('Received offer from Pi');
      await pc.current!.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current!.createAnswer();
      await pc.current!.setLocalDescription(answer);
      socket.emit('answer', answer);
    });

    socket.on('ice-candidate', async (candidate: any) => {
      try {
        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding remote ICE candidate', e);
      }
    });

    pc.current.onicecandidate = (event: any) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    console.log('Waiting for Pi to send offer...');
  };

  const stopStream = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (stream) {
      stream.release();
      setStream(null);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>
        {stream && (
          <RTCPIPView
            ref={viewRef}
            streamURL={stream.toURL()}
            style={styles.stream}
            iosPIP={{ startAutomatically: true }}
          />
        )}
        <View style={styles.footer}>
          <Button title="Start Stream" onPress={startStream} />
          <Button title="Stop Stream" onPress={stopStream} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: COLORS.white,
  },
  stream: { flex: 1 },
  footer: {
    backgroundColor: COLORS.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
