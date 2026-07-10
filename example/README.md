# Subject Cutout Demo

Demo Expo độc lập cho `react-native-subject-cutout`. Demo không tích hợp vào bất kỳ tính năng sản phẩm nào.

## Chạy demo

```sh
cd example
npm install
npx expo prebuild --clean
npx expo run:ios
# hoặc npx expo run:android
```

Demo sử dụng native module nên cần development build; không chạy được trong Expo Go. Tính năng tách nền trên iOS cần thiết bị iOS 17 trở lên. Android cần API 24 trở lên.

Thư viện được tham chiếu bằng `file:..` để demo luôn dùng mã nguồn module đang phát triển. Khi muốn kiểm thử bản đã phát hành, đổi dependency thành:

```json
"react-native-subject-cutout": "^0.1.1"
```
