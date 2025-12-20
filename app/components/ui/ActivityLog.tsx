import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';

/* ---------- Types ---------- */

export type LogLevel = "INFO" | "WARN" | "ALERT" | "SYS";

interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
}

interface ActivityLogProps {
  logs: LogEntry[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logRow}>
      <Text style={[styles.time, { width: 60 }]}>{item.time}</Text>

      <Text
        style={[
          styles.level,
          item.level === "WARN" && styles.levelWarn,
          item.level === "ALERT" && styles.levelAlert,
          item.level === "SYS" && styles.levelSys
        ]}
      >
        {item.level}
      </Text>

      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { width: 60 }]}>TIME</Text>
          <Text style={[styles.headerText, { width: 70 }]}>LEVEL</Text>
          <Text style={styles.headerText}>EVENT</Text>
        </View>

        {/* Rows */}
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 6
  },

  container: {
    backgroundColor: "#0b0b0b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1c1c1c",
    paddingVertical: 6
  },

  header: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c1c"
  },

  headerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.8
  },

  logRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6
  },

  time: {
    fontSize: 12,
    color: COLORS.textSecondary
  },

  level: {
    width: 70,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted
  },

  levelWarn: {
    color: "#f5a623"
  },

  levelAlert: {
    color: "#ff3b3b"
  },

  levelSys: {
    color: COLORS.accent1
  },

  message: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary
  },

  separator: {
    height: 1,
    backgroundColor: "#1a1a1a"
  }
});

export { LogEntry };
export default ActivityLog;