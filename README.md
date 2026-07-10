# react-native-subject-cutout

Tách người, thú cưng hoặc vật thể nổi bật khỏi ảnh cục bộ và trả về PNG trong suốt. Module xử lý hoàn toàn trên thiết bị:

- **iOS 17+**: Apple Vision `VNGenerateForegroundInstanceMaskRequest`.
- **Android API 24+**: Google ML Kit Subject Segmentation.

## Cài đặt

Đặt thư mục này trong monorepo hoặc publish nó lên registry riêng, sau đó thêm dependency:

```sh
npm install ./react-native-subject-cutout
cd ios && pod install
```

Với Expo, cần dùng development build/prebuild vì đây là native module:

```sh
npx expo prebuild
npx expo run:ios
```

## Sử dụng

`uri` phải là đường dẫn ảnh cục bộ `file://`. `expo-image-picker` và `react-native-image-picker` đều cung cấp URI kiểu này.

```ts
import { cutout, extractSubjects } from 'react-native-subject-cutout';

// Dùng cho luồng sticker một chủ thể.
const sticker = await cutout(asset.uri);
// sticker.uri là PNG trong suốt, sticker.width và sticker.height là kích thước đã crop.

// Hoặc để người dùng chọn khi ảnh có nhiều chủ thể.
const { subjects } = await extractSubjects(asset.uri);
```

Tệp PNG nằm trong cache của ứng dụng. Hãy sao chép chúng sang storage lâu dài trước khi xóa cache hoặc gọi `clearCache()`.

## Lưu ý tích hợp

- Android tải model ML Kit qua Google Play services. Lần chạy đầu có thể cần chờ model tải xong.
- Trả về nhiều PNG nếu framework nhận diện nhiều chủ thể. `cutout(uri)` lấy chủ thể đầu tiên.
- Chụp/resize ảnh tối thiểu 512×512 để cải thiện chất lượng tách nền trên Android.
- Với ảnh phức tạp hoặc không có chủ thể rõ ràng, promise trả lỗi `E_NO_SUBJECT`.

## Dùng cho hiệu ứng trong video

Đặt PNG trả về vào một `Image`/Skia canvas, thêm viền trắng và bóng phía sau, rồi dùng Reanimated animate `opacity`, `scale`, và `translateY`. Hiệu ứng dither reveal nên được vẽ bằng Skia shader/mask thay vì tạo nhiều React `View`.
