/* ==========================================
   1. CẤU HÌNH MẶC ĐỊNH & BIẾN TOÀN CỤC
   ========================================== */
const IMGBB_API_KEY = "ef14a8e57c65d06604b33482fab131f0";

let CONFIG = {
    pass: "1234",
    title: "Anh & Em",
    date: "2024-06-23",
    days: 365,
    music: "nhac.mp3",
    centerImg: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400",
    imgs: [
        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400",
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400",
        "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400",
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400"
    ],
    captions: ["Lần đầu gặp", "Đi chơi chung", "Kỷ niệm đẹp", "Mãi bên nhau"],
    letter: "Cảm ơn em đã xuất hiện và biến mỗi ngày của anh trở nên thật đặc biệt. Yêu em nhiều! ❤️"
};

let uploadedCenterImg = CONFIG.centerImg;
let uploadedImages = [...CONFIG.imgs];
let dangPhatNhac = false;
const bgMusic = document.getElementById("bg-music");

// Mã hóa tiếng Việt sang URL-Safe Base64
function encodeSafeData(obj) {
    const jsonStr = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(jsonStr);
    let binStr = "";
    bytes.forEach(b => binStr += String.fromCharCode(b));
    return btoa(binStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Giải mã dữ liệu từ URL
function decodeSafeData(encodedStr) {
    let base64 = encodedStr.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
}

/* ==========================================
   2. PHÂN LUỒNG GIAO DIỆN (TẠO / XEM)
   ========================================== */
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get("data");

    if (dataParam) {
        try {
            const decoded = decodeSafeData(dataParam);
            CONFIG = { ...CONFIG, ...decoded };

            const creatorScreen = document.getElementById("creator-screen");
            if (creatorScreen) creatorScreen.style.display = "none";

            apDungDuLieuLenGiaoDien();
        } catch (err) {
            alert("Link chia sẻ bị thiếu ký tự ở cuối do quá dài! Hãy dán API Key ImgBB vào script.js để link ngắn gọn nhé.");
        }
    } else {
        const creatorScreen = document.getElementById("creator-screen");
        if (creatorScreen) creatorScreen.style.display = "flex";
    }
});

function apDungDuLieuLenGiaoDien() {
    const titleEl = document.getElementById("display-title") || document.querySelector(".glow-title");
    if (titleEl) titleEl.textContent = CONFIG.title;

    const avatarEl = document.getElementById("lock-avatar");
    if (avatarEl) {
        avatarEl.src = CONFIG.centerImg || CONFIG.imgs[0];
    }

    const centerPhotoEl = document.getElementById("center-photo");
    if (centerPhotoEl) {
        centerPhotoEl.src = CONFIG.centerImg || CONFIG.imgs[0];
    }

    if (bgMusic && CONFIG.music) {
        bgMusic.src = CONFIG.music;
        bgMusic.load();
    }

    if (CONFIG.imgs) {
        CONFIG.imgs.forEach((url, idx) => {
            const imgEl = document.getElementById(`img-${idx}`);
            if (imgEl) imgEl.src = url;

            const capEl = document.getElementById(`cap-${idx}`);
            if (capEl && CONFIG.captions && CONFIG.captions[idx]) {
                capEl.textContent = CONFIG.captions[idx];
            }
        });
    }
}

/* ==========================================
   3. UPLOAD ẢNH HD & TẠO LINK CHIA SẺ
   ========================================== */
function doiLuaChonNhac() {
    const sel = document.getElementById("inp-music-select").value;
    const customInp = document.getElementById("inp-music-custom");
    if (customInp) customInp.style.display = (sel === "custom") ? "block" : "none";
}

// Hàm nén ảnh siêu gọn (giúp link luôn ngắn, không bao giờ lỗi khi chưa có API Key)
function nenAnhSieuNhe(rawDataUrl, maxWidth, quality, callback) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = rawDataUrl;
}

// Chọn ảnh nằm chính giữa trái tim
async function xuLyChonAnhGiua(input) {
    const file = input.files[0];
    if (!file) return;

    const prevEl = document.getElementById("prev-center");
    const labelSpan = input.parentElement.querySelector("span");
    if (labelSpan) labelSpan.textContent = "Đang xử lý ảnh giữa...";

    const reader = new FileReader();
    reader.onload = async function (e) {
        const rawDataUrl = e.target.result;
        if (prevEl) prevEl.src = rawDataUrl;

        const luuDuPhong = () => {
            nenAnhSieuNhe(rawDataUrl, 160, 0.65, (compressedUrl) => {
                uploadedCenterImg = compressedUrl;
                if (labelSpan) labelSpan.textContent = "❤️ Đã chọn ảnh giữa ✓";
            });
        };

        if (!IMGBB_API_KEY || IMGBB_API_KEY === "DAN_API_KEY_CUA_BAN_VAO_DAY") {
            luuDuPhong();
            return;
        }

        try {
            const base64Only = rawDataUrl.split(",")[1];
            const formData = new FormData();
            formData.append("image", base64Only);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY.trim()}`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                uploadedCenterImg = data.data.url;
                if (labelSpan) labelSpan.textContent = "❤️ Đã tải HD ảnh giữa ✓";
            } else {
                luuDuPhong();
            }
        } catch (err) {
            luuDuPhong();
        }
    };
    reader.readAsDataURL(file);
}

// Chọn 4 ảnh Polaroid xung quanh
async function xuLyChonAnh(input, index) {
    const file = input.files[0];
    if (!file) return;

    const prevEl = document.getElementById(`prev-${index}`);
    const labelSpan = input.parentElement.querySelector("span");
    if (labelSpan) labelSpan.textContent = "Đang xử lý...";

    const reader = new FileReader();
    reader.onload = async function (e) {
        const rawDataUrl = e.target.result;
        if (prevEl) prevEl.src = rawDataUrl;

        const luuDuPhong = () => {
            nenAnhSieuNhe(rawDataUrl, 140, 0.6, (compressedUrl) => {
                uploadedImages[index] = compressedUrl;
                if (labelSpan) labelSpan.textContent = "Đã chọn ✓";
            });
        };

        if (!IMGBB_API_KEY || IMGBB_API_KEY === "DAN_API_KEY_CUA_BAN_VAO_DAY") {
            luuDuPhong();
            return;
        }

        try {
            if (labelSpan) labelSpan.textContent = "Đang tải HD...";
            const base64Only = rawDataUrl.split(",")[1];
            const formData = new FormData();
            formData.append("image", base64Only);

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY.trim()}`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                uploadedImages[index] = data.data.url;
                if (labelSpan) labelSpan.textContent = "Đã tải HD ✓";
            } else {
                luuDuPhong();
            }
        } catch (err) {
            luuDuPhong();
        }
    };
    reader.readAsDataURL(file);
}

// Đóng gói dữ liệu và xuất đường link
function taoDuongLink() {
    try {
        const elPass = document.getElementById("inp-pass");
        const elTitle = document.getElementById("inp-title");
        const elDate = document.getElementById("inp-date");
        const elDays = document.getElementById("inp-days");
        const elLetter = document.getElementById("inp-letter");

        const passVal = elPass ? elPass.value.trim() : "1234";
        if (!/^\d{4}$/.test(passVal)) {
            alert("Vui lòng nhập mật khẩu gồm đúng 4 chữ số!");
            return;
        }

        const daysVal = (elDays && elDays.value !== "") ? parseInt(elDays.value, 10) : 0;

        const selMusic = document.getElementById("inp-music-select");
        const customMusic = document.getElementById("inp-music-custom");
        let musicVal = "nhac.mp3";
        if (selMusic) {
            musicVal = (selMusic.value === "custom" && customMusic && customMusic.value.trim())
                ? customMusic.value.trim()
                : selMusic.value;
        }

        const captionsVal = [0, 1, 2, 3].map(i => {
            const el = document.getElementById(`inp-caption-${i}`);
            return (el && el.value.trim()) ? el.value.trim() : `Kỷ niệm ${i + 1}`;
        });

        const newData = {
            pass: passVal,
            title: (elTitle && elTitle.value.trim()) ? elTitle.value.trim() : "Anh & Em",
            date: (elDate && elDate.value) ? elDate.value : "2024-06-23",
            days: daysVal,
            music: musicVal,
            centerImg: uploadedCenterImg,
            imgs: uploadedImages,
            captions: captionsVal,
            letter: (elLetter && elLetter.value.trim()) ? elLetter.value.trim() : CONFIG.letter
        };

        const safeEncoded = encodeSafeData(newData);
        const baseUrl = window.location.href.split("?")[0];
        const finalUrl = `${baseUrl}?data=${safeEncoded}`;

        const urlBox = document.getElementById("generated-url");
        const resultBox = document.getElementById("share-result");

        if (urlBox && resultBox) {
            urlBox.value = finalUrl;
            resultBox.style.display = "block";
            resultBox.scrollIntoView({ behavior: "smooth" });
        }
        CONFIG = newData;
    } catch (err) {
        alert("Lỗi xuất link: " + err.message);
    }
}

function copyLink() {
    const urlInput = document.getElementById("generated-url");
    if (!urlInput || !urlInput.value) return;

    urlInput.focus();
    urlInput.select();
    urlInput.setSelectionRange(0, 999999);

    try {
        if (document.execCommand("copy")) {
            alert("Đã sao chép đường link thành công! Bạn có thể dán (Ctrl+V) để gửi ngay.");
            return;
        }
    } catch (err) {}

    if (navigator.clipboard) {
        navigator.clipboard.writeText(urlInput.value).then(() => {
            alert("Đã sao chép đường link thành công!");
        }).catch(() => {
            alert("Hãy nhấn Ctrl + C để sao chép đường link đang được bôi đen!");
        });
    }
}

function xemThuNgay() {
    apDungDuLieuLenGiaoDien();
    const creatorScreen = document.getElementById("creator-screen");
    if (creatorScreen) creatorScreen.style.display = "none";
}

function quayLaiTao() {
    window.location.href = window.location.href.split("?")[0];
}

/* ==========================================
