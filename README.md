# react-native-subject-cutout

[![npm version](https://img.shields.io/npm/v/react-native-subject-cutout.svg)](https://www.npmjs.com/package/react-native-subject-cutout)
[![npm downloads](https://img.shields.io/npm/dm/react-native-subject-cutout.svg)](https://www.npmjs.com/package/react-native-subject-cutout)
[![license](https://img.shields.io/npm/l/react-native-subject-cutout.svg)](./LICENSE)

Tách người, thú cưng hoặc vật thể nổi bật khỏi ảnh cục bộ, rồi trả về PNG nền trong suốt để dùng làm sticker, avatar hoặc hiệu ứng cutout trong React Native. Toàn bộ xử lý chạy trên thiết bị.

| Platform | Native technology | Minimum version |
| --- | --- | --- |
| iOS | Apple Vision `VNGenerateForegroundInstanceMaskRequest` | App target: iOS 13.4; cutout feature: iOS 17 |
| Android | Google ML Kit Subject Segmentation | API 24 |

## Cài đặt

```sh
npm install react-native-subject-cutout
```

React Native CLI tự động link native module. Với iOS, cài Pods sau khi thêm package:

```sh
npx pod-install
```

Với Expo, module cần native code nên dùng development build:

```sh
npx expo prebuild
npx expo run:ios
# hoặc npx expo run:android
```

`Expo Go` không thể nạp module native này.

## Sử dụng

Truyền vào một URI ảnh local, ví dụ URI từ `expo-image-picker`, `react-native-image-picker`, hoặc ảnh từ camera.

```ts
import { cutout, extractSubjects, clearCache } from 'react-native-subject-cutout';

// Luồng phổ biến: lấy sticker của chủ thể đầu tiên.
const sticker = await cutout(asset.uri);

console.log(sticker);
// {
//   index: 0,
//   uri: 'file:///.../rn-subject-cutout/subject-....png',
//   width: 824,
//   height: 1096,
// }

// Khi ảnh có nhiều chủ thể, hiển thị danh sách để người dùng chọn.
const { subjects } = await extractSubjects(asset.uri);

// Xóa các PNG tạm do module tạo.
await clearCache();
```

### API

#### `cutout(uri, subjectIndex?)`

Trả về một chủ thể đã crop dưới dạng PNG trong suốt. `subjectIndex` mặc định là `0`.

#### `extractSubjects(uri)`

Trả về tất cả chủ thể mà nền tảng nhận diện được:

```ts
type Subject = {
  index: number;
  uri: string;
  width: number;
  height: number;
};

type SubjectExtractionResult = {
  subjects: Subject[];
};
```

#### `clearCache()`

Xóa PNG tạm trong thư mục cache của ứng dụng. Nếu cần giữ ảnh, hãy sao chép `subject.uri` vào storage lâu dài trước khi gọi hàm này hoặc trước khi hệ điều hành dọn cache.

## Lưu ý nền tảng

- Chỉ hỗ trợ URI ảnh cục bộ. Với iOS, URI phải là `file://`.
- Android tải model ML Kit bằng Google Play services; lần chạy đầu có thể chờ model tải xong.
- ML Kit tách nền tốt hơn với ảnh rõ nét từ 512×512 trở lên.
- Ảnh không có chủ thể nổi bật hoặc chủ thể sát nhau có thể trả lỗi `E_NO_SUBJECT` hoặc tạo một cutout chung.
- iOS dưới 17 trả lỗi `E_UNSUPPORTED_OS`.

## Dùng cho hiệu ứng sticker

`subject.uri` là PNG alpha đã crop. Đặt ảnh vào `Image` hoặc React Native Skia, thêm viền trắng/bóng và animate bằng Reanimated:

```tsx
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  opacity: stickerOpacity.value,
  transform: [{ scale: stickerScale.value }],
}));

<Animated.Image
  source={{ uri: sticker.uri }}
  style={[{ width: sticker.width / 3, height: sticker.height / 3 }, animatedStyle]}
/>
```

Để tạo hiệu ứng dither reveal như video tham chiếu, dùng Skia shader/mask thay vì tạo hàng trăm React `View`.

## Cho maintainer: phát hành version mới

Bản `0.1.0` đã public trên npm. Từ các bản sau, tăng version, đẩy tag và tạo GitHub Release:

```sh
npm version patch
git push --follow-tags
```

Workflow [`publish.yml`](.github/workflows/publish.yml) dùng npm trusted publishing qua GitHub OIDC để publish và tạo provenance; không cần lưu `NPM_TOKEN`. Đảm bảo npm package Settings → Trusted publishing trỏ tới `ngocdevv/react-native-subject-cutout` với workflow filename `publish.yml`.

## License

[MIT](./LICENSE)
