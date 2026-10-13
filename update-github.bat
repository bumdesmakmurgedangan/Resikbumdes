@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"
title UPDATE REPOSITORY GITHUB - RESIK BUMDES MAKMUR

cls
echo ============================================================
echo   UPDATE DAN SINKRONISASI REPOSITORY RESIK KE GITHUB
echo              BUMDES MAKMUR GEDANGAN
echo ============================================================
echo.

:: [1/4] Memeriksa status file
echo [1/4] Memeriksa status perubahan file lokal...
git status -s > "%temp%\resik_git_status.tmp"

for %%R in ("%temp%\resik_git_status.tmp") do set FILE_SIZE=%%~zR

if %FILE_SIZE% GTR 0 goto PROCESS_CHANGES
goto NO_CHANGES

:PROCESS_CHANGES
echo Ditemukan perubahan file berikut:
git status -s
del "%temp%\resik_git_status.tmp" 2>nul
echo.

:: [2/4] Pesan pembaruan
echo [2/4] Menyiapkan Catatan Pembaruan [Commit Message]...
echo Tips: Ketik pesan pembaruan lalu Enter, atau langsung tekan Enter untuk otomatis.
set "USER_MSG="
set /p "USER_MSG=Pesan update: "

if "!USER_MSG!"=="" (
    set "COMMIT_MSG=Pembaruan sistem RESIK BUMDes - !DATE! !TIME!"
) else (
    set "COMMIT_MSG=!USER_MSG!"
)
echo.
echo Catatan commit yang digunakan: "!COMMIT_MSG!"
echo.

:: [3/4] Menambahkan file & membuat commit
echo [3/4] Menyimpan versi perubahan lokal [git add dan commit]...
git add .
git commit -m "!COMMIT_MSG!"
echo Berhasil menyimpan perubahan ke repositori lokal.
echo.
goto DO_PUSH

:NO_CHANGES
del "%temp%\resik_git_status.tmp" 2>nul
echo Tidak ada file baru yang diubah (semua file lokal sudah tersimpan).
echo.
echo [2/4] Catatan Pembaruan [Dilewati: tidak ada perubahan baru].
echo [3/4] Penyimpanan Lokal [Dilewati: repositori lokal sudah bersih].
echo.
goto DO_PUSH

:DO_PUSH
:: [4/4] Mengunggah ke GitHub
echo [4/4] Mengunggah [Push] ke GitHub Repository...
echo URL Target : https://github.com/bumdesmakmurgedangan/Resikbumdes.git
echo Branch     : master
echo.

git push origin master
if !ERRORLEVEL! EQU 0 (
    echo.
    echo ============================================================
    echo       SEMUA PROSES SINKRONISASI GITHUB BERHASIL!
    echo ============================================================
    echo  - Repositori : https://github.com/bumdesmakmurgedangan/Resikbumdes
    echo  - Branch     : master
    echo  - Status     : Sinkron / Up to Date
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo       PERINGATAN: GAGAL MENGUNGGAH KE GITHUB!
    echo ============================================================
    echo  Kemungkinan penyebab:
    echo  1. Koneksi internet sedang terputus.
    echo  2. Sesi kredensial GitHub perlu verifikasi.
    echo ============================================================
)

echo.
echo Selesai. Tekan tombol apa saja untuk menutup jendela...
pause >nul
