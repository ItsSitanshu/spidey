import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const MJPEG_URL = 'http://10.10.254.98:5000/video';

export default function LiveFeed() {
  return (
    <View style={styles.container}>
      <WebView
        source={{
          html: `<html><body style="margin:0"><img src="${MJPEG_URL}" style="width:100%;height:100%" /></body></html>`,
        }}
        style={styles.video}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  video: { width: 350, height: 275 },
});
