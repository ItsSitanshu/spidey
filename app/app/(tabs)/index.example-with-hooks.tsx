/**
 * SPIDEY Screen - Example with Backend Integration Hooks
 * This shows how to use the backend hooks when ready to connect real data
 * 
 * To use this version:
 * 1. Rename this file to index.tsx
 * 2. Implement the actual backend connections in useSpideyBackend.ts
 * 3. Test with your backend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';
import {
  useSystemStatus,
  useIntrusionLog,
  useRobotControl,
  useLastActivity,
  LogEntry,
} from '@/hooks/useSpideyBackend';

interface StatusIndicatorProps {
  label: string;
  isOn: boolean;
  isAlert?: boolean;
}

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
  // Backend integration hooks
  const { status, toggleVideo, toggleAudio, toggleAlert } = useSystemStatus();
  const { logs } = useIntrusionLog();
  const { isPatrolling, isReturning, startPatrol, returnToDock } = useRobotControl();
  const lastActivity = useLastActivity();

  const [isExpanded, setIsExpanded] = useState(false);

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>{item.time}</Text>
      <Text style={styles.logMessage}>{item.message}</Text>
    </View>
  );

  return (
    <View style={[styles.container, status.alertOn && styles.alertBorder]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.spiderIcon}>🕷️</Text>
          <Text style={styles.title}>SPIDEY</Text>
        </View>
        <Text style={styles.subtitle}>Autonomous Security System</Text>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATUS</Text>
          <View style={styles.statusGrid}>
            <TouchableOpacity onPress={toggleVideo}>
              <StatusIndicator label="Video" isOn={status.videoOn} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleAudio}>
              <StatusIndicator label="Audio" isOn={status.audioOn} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleAlert}>
              <StatusIndicator label="Alert" isOn={status.alertOn} isAlert={true} />
            </TouchableOpacity>
          </View>
          <Text style={styles.lastActivity}>Last activity: {lastActivity}</Text>
        </View>

        {/* Live Feed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIVE FEED</Text>
          <TouchableOpacity
            style={[styles.liveFeed, isExpanded && styles.liveFeedExpanded]}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.liveFeedContent}>
              <Text style={styles.liveFeedTitle}>LIVE CAMERA STREAM</Text>
              <Text style={styles.liveFeedSubtitle}>(Raspberry Pi Feed)</Text>
              {status.videoOn && (
                <View style={styles.streamIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>STREAMING</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.tapToExpand}>
            {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
          </Text>
        </View>

        {/* Intrusion Log Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTRUSION LOG</Text>
          <View style={styles.logContainer}>
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.logSeparator} />}
            />
          </View>
        </View>

        {/* Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTROLS</Text>
          <View style={styles.controlsGrid}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isPatrolling && styles.controlButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={startPatrol}
              disabled={isPatrolling || isReturning}
            >
              <Text style={styles.controlButtonText}>
                {isPatrolling ? 'Patrolling...' : 'Start Patrol'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isReturning && styles.controlButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={returnToDock}
              disabled={isPatrolling || isReturning}
            >
              <Text style={styles.controlButtonText}>
                {isReturning ? 'Returning...' : 'Return to Dock'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>System: </Text>
            <Text
              style={[
                styles.footerText,
                status.connected ? styles.footerConnected : styles.footerDisconnected,
              ]}
            >
              {status.connected ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.footerText}> • </Text>
            <Text
              style={[
                styles.footerText,
                status.edgeProcessing ? styles.footerEdge : styles.footerDisconnected,
              ]}
            >
              Edge Processing {status.edgeProcessing ? 'ON' : 'OFF'}
            </Text>
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
    paddingTop: 50,
    paddingBottom: 10,
  },
  spiderIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent1,
    letterSpacing: 2,
    marginBottom: 15,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  statusIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  lastActivity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  liveFeed: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accent2,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveFeedExpanded: {
    height: 350,
  },
  liveFeedContent: {
    alignItems: 'center',
  },
  liveFeedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  liveFeedSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 15,
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
    fontSize: 11,
    color: COLORS.alertRed,
    fontWeight: '600',
  },
  tapToExpand: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logContainer: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    maxHeight: 180,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  logTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent1,
    marginRight: 15,
    width: 50,
  },
  logMessage: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  logSeparator: {
    height: 1,
    backgroundColor: COLORS.background,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  controlButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.accent1,
  },
  controlButtonActive: {
    backgroundColor: COLORS.accent2,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footerConnected: {
    color: COLORS.statusOn,
    fontWeight: '600',
  },
  footerDisconnected: {
    color: COLORS.alertRed,
    fontWeight: '600',
  },
  footerEdge: {
    color: COLORS.accent1,
    fontWeight: '600',
  },
});
