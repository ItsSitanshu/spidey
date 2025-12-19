import React, { useState} from 'react';
import WebView from 'react-native-webview';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';
import LiveFeed from '@/components/LiveFeed';
import SystemStatus from '@/components/SystemStatus';


interface LogEntry {
  id: string;
  time: string;
  message: string;
}

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
  
  // Sample intrusion log data
  const [intrusionLog] = useState<LogEntry[]>([
    { id: '1', time: '08:39', message: 'Sound spike detected' },
    { id: '2', time: '08:12', message: 'Motion investigation' },
    { id: '3', time: '07:55', message: 'Patrol completed' },
    { id: '4', time: '07:30', message: 'System initialized' },
    { id: '5', time: '07:15', message: 'Camera calibration complete' },
  ]);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const lastActivity = intrusionLog[0]?.time || currentTime;

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>{item.time}</Text>
      <Text style={styles.logMessage}>{item.message}</Text>
    </View>
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, alertOn && styles.alertBorder]}>
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
          <Text style={styles.sectionTitle}>LIVE FEED</Text>
          <TouchableOpacity
            style={[
              styles.liveFeed,
              isExpanded && styles.liveFeedExpanded
            ]}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.liveFeedContent}>
              <Text style={styles.liveFeedTitle}>LIVE CAMERA STREAM</Text>
              <Text style={styles.liveFeedSubtitle}>(Raspberry Pi Feed)</Text>

              {videoOn && (
                <View style={styles.streamIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>STREAMING</Text>
                </View>
              )}
              <LiveFeed/>
            </View>
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
          <Text style={styles.sectionTitle}>INTRUSION LOG</Text>
          <View style={styles.logContainer}>
            <FlatList
              data={intrusionLog}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.logSeparator} />}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTROLS</Text>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: COLORS.accent1,
    letterSpacing: 1.5,
    marginBottom: 12,
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
  logContainer: {
    backgroundColor: 'rgba(51, 51, 51, 0.4)',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(140, 82, 255, 0.15)',
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  logTime: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.accent1,
    marginRight: 12,
    width: 50,
  },
  logMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textPrimary,
    flex: 1,
  },
  logSeparator: {
    height: 1,
    backgroundColor: 'rgba(140, 82, 255, 0.1)',
    marginVertical: 4,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 0,
    shadowColor: COLORS.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textPrimary,
    textAlign: 'center',
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
    color: COLORS.statusOn,
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
