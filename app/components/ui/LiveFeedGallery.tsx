import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager
} from "react-native";
import { DEFAULT_COLORS as COLORS } from '@/constants/SpideyColors';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/hooks/use-firebase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GalleryImage {
  id: string;
  url: string;
  timestamp: number;
}

interface LiveFeedGalleryProps {
  videoOn: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}


const LiveFeedGallery: React.FC<LiveFeedGalleryProps> = ({
  videoOn,
  isExpanded,
  onToggleExpand
}) => {
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "live_feed"),
      orderBy("timestamp", "desc"),
      limit(6)
    );

    const unsub = onSnapshot(q, snapshot => {
      const data: GalleryImage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<GalleryImage, "id">)
      }));
      setImages(data);
    });

    return unsub;
  }, []);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  return (
    <View style={styles.section}>
      <Pressable
        onPress={toggle}
        style={[
          styles.container,
          isExpanded && styles.containerExpanded
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>CAMERA GALLERY</Text>
          <Text style={styles.subtitle}>Click to open live feed</Text>

          {/* {videoOn && (
            <View style={styles.streamIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>ACTIVE</Text>
            </View>
          )} */}
        </View>

        {isExpanded && (
          <FlatList
            data={images}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.image}
              />
            )}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: '100%',
    flex: 1
  },

  sectionTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10
  },

  container: {
    backgroundColor: "#121212",
    borderRadius: 22,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: "#1e1e1e"
  },

  containerExpanded: {
    paddingBottom: 12
  },

  header: {
    marginBottom: 12
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent1
  },

  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },

  streamIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent1,
    marginRight: 6
  },

  recordingText: {
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.accent1
  },

  row: {
    justifyContent: "space-between"
  },

  image: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#222"
  }
});


export default LiveFeedGallery;
