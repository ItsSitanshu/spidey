import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent
} from "react-native";
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';


interface StatusCardProps {
  label: string;
  active: boolean;
  alert?: boolean;
  onPress: (event: GestureResponderEvent) => void;
}

interface SystemStatusProps {
  videoOn: boolean;
  audioOn: boolean;
  alertOn: boolean;
  lastActivity: string;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleAlert: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({
  label,
  active,
  alert = false,
  onPress
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        active && styles.cardActive,
        active && alert && styles.cardAlert,
        pressed && styles.pressed
      ]}
    >
      <Text
        style={[
          styles.cardLabel,
          active && styles.cardLabelActive
        ]}
      >
        {label}
      </Text>

      <Text style={styles.cardState}>
        {active ? "ON" : "OFF"}
      </Text>
    </Pressable>
  );
};

const SystemStatus: React.FC<SystemStatusProps> = ({
  videoOn,
  audioOn,
  alertOn,
  lastActivity,
  onToggleVideo,
  onToggleAudio,
  onToggleAlert
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>STATUS</Text>
      <View style={styles.grid}>
        <StatusCard
          label="Video"
          active={videoOn}
          onPress={onToggleVideo}
        />

        <StatusCard
          label="Audio"
          active={audioOn}
          onPress={onToggleAudio}
        />

        <StatusCard
          label="Alert"
          active={alertOn}
          alert
          onPress={onToggleAlert}
        />
      </View>

      <Text style={styles.lastActivity}>
        Last activity: {lastActivity}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,    
    flex: 1,
    alignItems: 'center',
  },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 10
  },

  grid: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.accent2 + "33",
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 40,
  },

  card: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 18, // new iPhone UI vibe
    backgroundColor: "#121212",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e1e1e"
  },

  cardActive: {
    backgroundColor: COLORS.accent1 + "20",
    borderColor: COLORS.accent1
  },

  cardAlert: {
    backgroundColor: "#ff3b3b20",
    borderColor: "#ff3b3b"
  },

  pressed: {
    opacity: 0.85
  },

  cardLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 4
  },

  cardLabelActive: {
    color: COLORS.accent1,
    fontWeight: "600"
  },

  cardState: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 1
  },

  lastActivity: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted
  }
});


export default SystemStatus;
