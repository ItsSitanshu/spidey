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

/* Enable smooth expand animation on Android */
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- Types ---------- */

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

/* ---------- Component ---------- */

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
      limit(12)
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
      <Text style={styles.sectionTitle}>LIVE FEED</Text>

      <Pressable
        onPress={toggle}
        style={[
          styles.container,
          isExpanded && styles.containerExpanded
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>CAMERA GALLERY</Text>
          <Text style={styles.subtitle}>Raspberry Pi (Firebase Pool)</Text>

          {videoOn && (
            <View style={styles.streamIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>ACTIVE</Text>
            </View>
          )}
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

export default LiveFeedGallery;
