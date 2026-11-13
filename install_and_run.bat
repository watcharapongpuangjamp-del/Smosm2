@echo off
chcp 65001 > nul
echo ===================================================
echo   Smart OSM Next - ระบบสารสนเทศสุขภาพชุมชนและการจัดการงาน อสม.
echo   Script สำหรับติดตั้งและเริ่มระบบแบบอัตโนมัติ
echo ===================================================
echo.

echo [1/3] กำลังติดตั้ง Dependencies ทั้งหมด (npm install)...
call npm install --include=dev
if %errorlevel% neq 0 (
    echo [ERROR] เกิดข้อผิดพลาดในการติดตั้ง Dependencies โปรดตรวจสอบ Node.js และ npm
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] กำลังตรวจสอบความถูกต้องของ TypeScript และ Build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] เกิดข้อผิดพลาดในการ Build โปรดตรวจสอบโค้ด
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] กำลังเริ่มเปิด Development Server...
echo เปิดเบราว์เซอร์ไปที่ http://localhost:3000 เพื่อใช้งานระบบ
echo.
npm run dev
pause
