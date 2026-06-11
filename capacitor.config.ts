// ============================================================================
// capacitor.config.ts
// File cấu hình chính cho Capacitor — công cụ giúp đóng gói web app (React/Vite)
// thành ứng dụng native cho Android (APK/AAB) để publish lên Google Play Store.
// LƯU Ý: File này CHỈ cấu hình build native, KHÔNG ảnh hưởng tới gameplay.
// ============================================================================

// Import kiểu dữ liệu CapacitorConfig từ Capacitor CLI để TypeScript kiểm tra
// cú pháp config (autocomplete + báo lỗi nếu khai báo sai field).
import type { CapacitorConfig } from '@capacitor/cli';

// Khai báo object config với type CapacitorConfig — chứa toàn bộ thiết lập
// cho việc build app native.
const config: CapacitorConfig = {
  // appId: định danh duy nhất của ứng dụng trên Android (package name).
  // Bắt buộc theo định dạng reverse-domain (vd: com.company.app).
  // Giá trị này sẽ được dùng làm package name khi publish lên Google Play —
  // KHÔNG được thay đổi sau khi đã publish (mỗi appId = 1 app khác nhau).
  appId: 'app.lovable.60c08b2495fc45789d4af901851078c3',

  // appName: tên hiển thị của app trên màn hình điện thoại (dưới icon)
  // và trên Google Play Store. Có thể đổi sau khi publish.
  appName: 'dash-defender-dream',

  // webDir: thư mục chứa file web đã build (HTML/CSS/JS sau khi chạy `npm run build`).
  // Capacitor sẽ copy toàn bộ nội dung trong thư mục này vào app native
  // để chạy offline trên điện thoại. Với Vite, mặc định build ra thư mục 'dist'.
  webDir: 'dist',

  // server: cấu hình nguồn nội dung web mà app native sẽ load.
  // Hiện đang trỏ tới URL sandbox của Lovable để dev/test trên thiết bị thật
  // mà không cần build lại mỗi lần chỉnh code (hot-reload từ xa).
  // ⚠️ QUAN TRỌNG: Khi build APK production để publish lên Google Play,
  // PHẢI XÓA toàn bộ block `server` này để app chạy bằng file local trong `webDir`,
  // nếu không app sẽ phụ thuộc internet và không qua review của Google.
  server: {
    // url: địa chỉ web mà WebView trong app sẽ load khi mở.
    // forceHideBadge=true: ẩn badge "Edit with Lovable" khi chạy trong app.
    url: 'https://60c08b24-95fc-4578-9d4a-f901851078c3.lovableproject.com?forceHideBadge=true',

    // cleartext: cho phép load nội dung qua HTTP (không SSL) — cần thiết cho dev.
    // Production nên để false hoặc xóa hẳn để bảo mật (chỉ dùng HTTPS).
    cleartext: true
  }
};

// Export config làm default để Capacitor CLI tự đọc khi chạy các lệnh
// như `npx cap sync`, `npx cap add android`, `npx cap open android`.
export default config;
