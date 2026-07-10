import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { cutout, type Subject } from 'react-native-subject-cutout';

export default function App() {
  const [sourceUri, setSourceUri] = useState<string>();
  const [sticker, setSticker] = useState<Subject>();
  const [isExtracting, setIsExtracting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Hãy cấp quyền Thư viện ảnh để tiếp tục.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled) {
      setSourceUri(result.assets[0].uri);
      setSticker(undefined);
    }
  };

  const extractSubject = async () => {
    if (!sourceUri) {
      return;
    }

    setIsExtracting(true);
    try {
      setSticker(await cutout(sourceUri));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tách chủ thể từ ảnh này.';
      Alert.alert('Tách nền không thành công', message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 20 }}
      style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 28, fontWeight: '700', color: '#171717' }}>
          Subject Cutout
        </Text>
        <Text selectable style={{ color: '#666', lineHeight: 21 }}>
          Demo độc lập: chọn một ảnh rồi tạo PNG nền trong suốt bằng Vision hoặc ML Kit.
        </Text>
      </View>

      <View
        style={{
          minHeight: 240,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 24,
          borderCurve: 'continuous',
          backgroundColor: '#e8e8e8',
        }}>
        {sourceUri ? (
          <Image source={sourceUri} contentFit="contain" style={{ width: '100%', height: 300 }} />
        ) : (
          <Text selectable style={{ color: '#777' }}>Chưa chọn ảnh</Text>
        )}
      </View>

      <Pressable
        onPress={pickImage}
        style={({ pressed }) => ({
          alignItems: 'center',
          borderRadius: 14,
          borderCurve: 'continuous',
          backgroundColor: '#171717',
          opacity: pressed ? 0.75 : 1,
          paddingVertical: 15,
        })}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Chọn ảnh</Text>
      </Pressable>

      <Pressable
        disabled={!sourceUri || isExtracting}
        onPress={extractSubject}
        style={({ pressed }) => ({
          alignItems: 'center',
          borderRadius: 14,
          borderCurve: 'continuous',
          backgroundColor: sourceUri ? '#2a6df4' : '#b6b6b6',
          opacity: pressed || isExtracting ? 0.7 : 1,
          paddingVertical: 15,
        })}>
        {isExtracting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Tách nền</Text>
        )}
      </Pressable>

      {sticker ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={{ fontSize: 18, fontWeight: '700', color: '#171717' }}>
            Kết quả PNG trong suốt
          </Text>
          <View
            style={{
              alignItems: 'center',
              borderRadius: 24,
              borderCurve: 'continuous',
              backgroundColor: '#d9d9d9',
              padding: 20,
            }}>
            <Image
              source={sticker.uri}
              contentFit="contain"
              style={{ width: 260, height: 260 }}
            />
          </View>
          <Text selectable style={{ color: '#666' }}>
            {sticker.width} × {sticker.height} px
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
