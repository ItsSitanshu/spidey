/**
 * SPIDEY Backend Integration Hooks
 * Placeholder hooks ready for backend connection
 */

import { useState, useEffect, useCallback } from 'react';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
}

export interface SystemStatus {
  videoOn: boolean;
  audioOn: boolean;
  alertOn: boolean;
  connected: boolean;
  edgeProcessing: boolean;
}

/**
 * Hook for managing system status
 * TODO: Connect to WebSocket or API endpoint
 */
export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    videoOn: true,
    audioOn: true,
    alertOn: false,
    connected: true,
    edgeProcessing: true,
  });

  // TODO: Replace with actual backend connection
  // Example:
  // useEffect(() => {
  //   const ws = new WebSocket('ws://spidey-backend:8080/status');
  //   ws.onmessage = (event) => {
  //     setStatus(JSON.parse(event.data));
  //   };
  //   return () => ws.close();
  // }, []);

  const toggleVideo = useCallback(() => {
    setStatus((prev) => ({ ...prev, videoOn: !prev.videoOn }));
    // TODO: Send command to backend
    // fetch('/api/video/toggle', { method: 'POST' });
  }, []);

  const toggleAudio = useCallback(() => {
    setStatus((prev) => ({ ...prev, audioOn: !prev.audioOn }));
    // TODO: Send command to backend
    // fetch('/api/audio/toggle', { method: 'POST' });
  }, []);

  const toggleAlert = useCallback(() => {
    setStatus((prev) => ({ ...prev, alertOn: !prev.alertOn }));
    // TODO: Send command to backend
    // fetch('/api/alert/toggle', { method: 'POST' });
  }, []);

  return {
    status,
    toggleVideo,
    toggleAudio,
    toggleAlert,
  };
}

/**
 * Hook for intrusion log with real-time updates
 * TODO: Connect to WebSocket for live updates
 */
export function useIntrusionLog() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '08:39', message: 'Sound spike detected' },
    { id: '2', time: '08:12', message: 'Motion investigation' },
    { id: '3', time: '07:55', message: 'Patrol completed' },
    { id: '4', time: '07:30', message: 'System initialized' },
    { id: '5', time: '07:15', message: 'Camera calibration complete' },
  ]);

  // TODO: Replace with actual WebSocket connection
  // useEffect(() => {
  //   const ws = new WebSocket('ws://spidey-backend:8080/logs');
  //   ws.onmessage = (event) => {
  //     const newLog = JSON.parse(event.data);
  //     setLogs((prev) => [newLog, ...prev].slice(0, 20)); // Keep last 20
  //   };
  //   return () => ws.close();
  // }, []);

  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  return {
    logs,
    addLog,
  };
}

/**
 * Hook for video stream URL
 * TODO: Connect to actual video stream source
 */
export function useVideoStream() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual stream connection
  // useEffect(() => {
  //   setIsLoading(true);
  //   fetch('/api/video/stream-url')
  //     .then(res => res.json())
  //     .then(data => {
  //       setStreamUrl(data.url);
  //       setIsLoading(false);
  //     })
  //     .catch(err => {
  //       setError(err.message);
  //       setIsLoading(false);
  //     });
  // }, []);

  return {
    streamUrl,
    isLoading,
    error,
  };
}

/**
 * Hook for robot control commands
 * TODO: Connect to actual robot control API
 */
export function useRobotControl() {
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const startPatrol = useCallback(async () => {
    setIsPatrolling(true);
    // TODO: Send command to backend
    // try {
    //   await fetch('/api/robot/start-patrol', { method: 'POST' });
    // } catch (error) {
    //   console.error('Failed to start patrol:', error);
    //   setIsPatrolling(false);
    // }
    
    // Simulate patrol for demo
    setTimeout(() => setIsPatrolling(false), 5000);
  }, []);

  const returnToDock = useCallback(async () => {
    setIsReturning(true);
    // TODO: Send command to backend
    // try {
    //   await fetch('/api/robot/return-dock', { method: 'POST' });
    // } catch (error) {
    //   console.error('Failed to return to dock:', error);
    //   setIsReturning(false);
    // }
    
    // Simulate return for demo
    setTimeout(() => setIsReturning(false), 3000);
  }, []);

  return {
    isPatrolling,
    isReturning,
    startPatrol,
    returnToDock,
  };
}

/**
 * Hook for last activity timestamp
 * TODO: Connect to actual activity monitoring
 */
export function useLastActivity() {
  const [lastActivity, setLastActivity] = useState<string>(
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );

  // TODO: Replace with actual backend connection
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetch('/api/last-activity')
  //       .then(res => res.json())
  //       .then(data => setLastActivity(data.timestamp));
  //   }, 30000); // Update every 30 seconds
  //   return () => clearInterval(interval);
  // }, []);

  return lastActivity;
}
