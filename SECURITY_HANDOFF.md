# SECURITY_HANDOFF — Dynomobile-ThanhThai / 37TSR

**Tai lieu cong khai ve phan loai; chua giau source.** Repo `letan99vl/Dynomobile-ThanhThai` dang PUBLIC.

## P0 - PUBLIC RUNTIME (PHUC VU GITHUB PAGES)
- `index.html`, `manifest.webmanifest`, `.nojekyll`, `live/head.html`, `live/rpm.html`, `live/speed.html`, `live/kpis.html`, `live/info.html`, `assets/` duoc web su dung.
- URL: `https://letan99vl.github.io/Dynomobile-ThanhThai/`.
- GitHub Pages dang deploy tu `main/root`. Can tiep tuc publish file tren URL nay neu co tach kho.

## P1 - PRIVATE SOURCE / BUILD
- `firmware/DynoTL_Mobile_BLE_ESP32S3.ino`.
- `android/`, `ios/` (native apps va script build); `.github/workflows/` build Android/iOS/launcher.
- Noi bo `PROJECT_HANDOFF.md` can duoc sao luu trong PRIVATE de giu kien thuc firmware/201m/shift-light; file public nay chi la chi muc.

## P0 SECURITY ALERT
- Workflow Android co buoc giai ma `dynotl-mobile.jks.b64` tu archive Android. Archive o repo PUBLIC -> CAN KIEM TRA NGAY KHOA KY APK DA BI LO HAY CHUA. Khong doi key ky APK tuy tien: co the lam mat kha nang update cho nguoi dung cu.
- Chuyen PRIVATE khong xoa ban sao Git duoc clone luc PUBLIC.

## Duong tim
- Doc `PROJECT_HANDOFF.md` truoc mo du an. PB web da quan sat: 1.006.
- Giữ logic tach 201m raw pulse va Live/HP/Torque da loc; giu quy uoc PB.
- Kho PRIVATE du kien: `letan99vl/Dynomobile-ThanhThai-source` (CHI DE XUAT, CHUA TAO).

## Trang thai bao ve (2026-10-16)
- [x] Da phan loai file va ghi huong dan ban giao.
- [ ] Chua co kho PRIVATE duoc tao/xac minh cho du an nay.
- [ ] CHUA di chuyen/xoa source khoi PUBLIC.
- [ ] CHUA xoa lich su Git PUBLIC (xoa file o commit moi khong lam lich su bien mat).
- [ ] CHUA thuc hien test hoat dong sau migration.

## Quy tac cho ChatGPT / nguoi tiep quan
1. Doc file nay TRUOC, sau do doc handoff va state file duoc dan ben duoi.
2. Khong dua source quan trong vao branch moi cua repo PUBLIC va goi do la bao mat: moi branch/public history van xem duoc.
3. Truoc khi xoa/boc tach: sao luu, tao kho PRIVATE that, xac nhan GitHub app co quyen, chuyen code/test/CI, sau do moi publish runtime va test tren may khach.
4. Khong do/i duong dan URL hoac phien ban dang duoc app khach su dung neu chua test.
5. Sau moi thay doi, cap nhat trang thai, duong dan PRIVATE that, commit SHA, PB/version, huong dan rollback trong file nay va handoff noi bo. Khong ghi secret, token, password, key ky vao file nay.
6. Neu nghi khoa ky/secret tung nam tren PUBLIC, nen coi la nguy co da lo va xu ly bang quy trinh rotate an toan; chuyen Private khong thu hoi ban sao cu.
