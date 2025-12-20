import React, { useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal
} from 'react-native';
import { Image } from 'expo-image';

import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';

import LiveFeed from '@/components/ui/LiveFeed';
import SystemStatus from '@/components/SystemStatus';
import LiveFeedGallery from '@/components/ui/LiveFeedGallery';
import ActivityLog, { LogEntry } from '@/components/ui/ActivityLog';


interface StatusIndicatorProps {
  label: string;
  isOn: boolean;
  isAlert?: boolean;
}

const PI_STREAM_URL = "http://10.10.254.98:5000/video";

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, isOn, isAlert = false }) => (
  <View style={styles.statusIndicator}>
    <Text style={styles.statusLabel}>{label}</Text>
    <View style={styles.statusDot}>
      <View
        style={[
          styles.statusCircle,
          {
            backgroundColor: isAlert
              ? isOn
                ? COLORS.alertRed
                : COLORS.statusOff
              : isOn
              ? COLORS.statusOn
              : COLORS.statusOff,
          },
        ]}
      />
      <Text style={styles.statusText}>{isOn ? 'ON' : 'OFF'}</Text>
    </View>
  </View>
);

export default function SpideyScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [alertOn, setAlertOn] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [intrusionLog] = useState<LogEntry[]>([
    { id: '1', level: "WARN", time: '08:39', message: 'Sound spike detected' },
    { id: '2', level: "ALERT", time: '08:12', message: 'Motion investigation' },
    { id: '3', level: 'INFO', time: '07:55', message: 'Patrol completed' },
    { id: '4', level: 'SYS', time: '07:30', message: 'System initialized' },
    { id: '5', level: 'SYS', time: '07:15', message: 'Camera calibration complete' },
  ]);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const lastActivity = intrusionLog[0]?.time || currentTime;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, alertOn && styles.alertBorder]}>
      <Modal
        visible={isExpanded}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={styles.fullscreen}>
          <LiveFeed actClose={() => setIsExpanded(!isExpanded)}/>
        </View>
      </Modal>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>SPIDEY</Text>
        </View>

        {/* Status Section */}

        {/* Live Feed Section */}
        <View style={styles.section}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}><Text style={styles.sectionTitle}>LIVE FEED</Text></View>
          <TouchableOpacity
            style={[
              styles.liveFeed,
              isExpanded && styles.liveFeedExpanded
            ]}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.8}
          >
            {!isExpanded  && <LiveFeedGallery videoOn isExpanded onToggleExpand={() => setIsExpanded(!isExpanded)} />}
          </TouchableOpacity>
        </View>
        
        <SystemStatus
          videoOn={videoOn}
          audioOn={audioOn}
          alertOn={alertOn}
          lastActivity={lastActivity}
          onToggleVideo={() => setVideoOn(v => !v)}
          onToggleAudio={() => setAudioOn(a => !a)}
          onToggleAlert={() => setAlertOn(a => !a)}
        />

        <View style={styles.section}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}><Text style={styles.sectionTitle}>CONTROLS</Text></View>
          <View style={styles.controlsGrid}>
            <TouchableOpacity 
              style={styles.controlButton}
              activeOpacity={0.7}
              onPress={() => console.log('Start Patrol')}
            >
              <Text style={styles.controlButtonText}>Start Patrol</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton}
              activeOpacity={0.7}
              onPress={() => console.log('Return to Dock')}
            >
              <Text style={styles.controlButtonText}>Return to Dock</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10}}><Text style={styles.sectionTitle}>LOGS</Text></View>
          <ActivityLog logs={intrusionLog}/>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>System: </Text>
            <Text style={[styles.footerText, styles.footerConnected]}>Connected</Text>
            <Text style={styles.footerText}> • </Text>
            <Text style={[styles.footerText, styles.footerEdge]}>Edge Processing ON</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  alertBorder: {
    borderWidth: 4,
    borderColor: COLORS.alertRed,
  },
  scrollContainer: {
    flex: 1,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 8,
    gap: 12,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 54,
    fontFamily: 'Inter_700Bold',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: COLORS.accent1,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(140, 82, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(140, 82, 255, 0.2)',
  },
  statusIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statusDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textPrimary,
  },
  lastActivity: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  liveFeed: {
    backgroundColor: 'rgba(130, 65, 245, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accent2,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveFeedExpanded: {
    height: 400,
  },
  liveFeedContent: {
    alignItems: 'center',
  },
  liveFeedTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  liveFeedSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  streamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.alertRed,
    marginRight: 6,
  },
  recordingText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.alertRed,
  },
  tapToExpand: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: COLORS.accent1,
    textAlign: 'center',
    opacity: 0.8,
  },
  controlsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  controlButton: {
    flex: 1,
    backgroundColor: "#0e0e0e", // near-black, not primary
    borderRadius: 18, // more iOS
    paddingVertical: 16,
    paddingHorizontal: 18,

    borderWidth: 1,
    borderColor: COLORS.accent1 + "30", // subtle accent ring

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  controlButtonActive: {
    backgroundColor: COLORS.accent1 + "20",
    borderColor: COLORS.accent1
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: 0.3
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 82, 255, 0.15)',
    marginTop: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSecondary,
  },
  footerConnected: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },
  footerEdge: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.accent1,
  },
  video: {
    width: '100%',
    height: 250,
    marginTop: 12,
    borderRadius: 12,
  },
});
