/**
 * Lentera Hijaiyah - Workshop Edition (Pure HTML/JS + Roboflow AI)
 * 5 Huruf Hijaiyah: Alif, Ba, Ta, Tsa, Jim
 */

// ─── 1. Definisi 5 Huruf Hijaiyah ──────────────────────────────────────────
const LETTERS = [
  { id: "alif", label: "Alif", file: "alif.svg" },
  { id: "ba",   label: "Ba",   file: "ba.svg" },
  { id: "ta",   label: "Ta",   file: "ta.svg" },
  { id: "tsa",  label: "Tsa",  file: "tsa.svg" },
  { id: "jim",  label: "Jim",  file: "jim.svg" }
];

let selectedLetter = LETTERS[0];
let isChecking = false;

// ─── 2. Manajemen Konfigurasi (.env / LocalStorage / Settings) ────────────────
const config = {
  apiKey: "",
  modelUrl: "https://serverless.roboflow.com/infer/workflows/zay-nav/hijaiyah-workflow"
};

async function initConfig() {
  // 1. Baca langsung dari file .env
  try {
    const res = await fetch("./.env");
    if (res.ok) {
      const text = await res.text();
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...vals] = trimmed.split("=");
        const val = vals.join("=").replace(/^["']|["']$/g, "").trim();
        if (key.trim() === "ROBOFLOW_API_KEY" && val) config.apiKey = val;
        if (key.trim() === "ROBOFLOW_MODEL_URL" && val) config.modelUrl = val;
      }
    }
  } catch (e) {
    // Abaikan jika dibuka via file:// yang membatasi fetch lokal
  }

  // 3. Timpa dengan pengaturan manual di LocalStorage jika pernah disimpan via UI
  const savedKey = localStorage.getItem("ROBOFLOW_API_KEY");
  const savedUrl = localStorage.getItem("ROBOFLOW_MODEL_URL");
  if (savedKey) config.apiKey = savedKey;
  if (savedUrl) config.modelUrl = savedUrl;

  console.log("Roboflow Config siap:", {
    hasKey: !!config.apiKey,
    modelUrl: config.modelUrl
  });
}

// ─── 3. Inisialisasi Tampilan Tombol Huruf Hijaiyah ──────────────────────────
const letterGridEl = document.getElementById("letter-grid");
const selectedBadgeEl = document.getElementById("selected-letter-badge");

function renderLetterButtons() {
  letterGridEl.innerHTML = "";

  LETTERS.forEach((letter) => {
    const isActive = selectedLetter.id === letter.id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-150 ${
      isActive
        ? "border-brand bg-brand shadow-[3px_3px_0_#9b2c16]"
        : "border-stone-900 bg-white hover:border-brand hover:shadow-[3px_3px_0_#d96852]"
    }`;

    btn.innerHTML = `
      <div class="flex h-12 w-full items-center justify-center">
        <img
          src="./assets/aset-hijaiyah/${letter.file}"
          alt="${letter.label}"
          class="h-9 w-9 object-contain transition-all ${isActive ? "brightness-0 invert" : ""}"
        />
      </div>
      <span class="text-xs font-bold leading-none ${isActive ? "text-white" : "text-stone-700"}">
        ${letter.label}
      </span>
    `;

    btn.addEventListener("click", () => {
      selectedLetter = letter;
      selectedBadgeEl.textContent = letter.label;
      renderLetterButtons();
      clearCanvas();
    });

    letterGridEl.appendChild(btn);
  });
}

// ─── 4. Kanvas Menggambar Interaktif (Mouse & Touch) ─────────────────────────
const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let lastPos = null;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  // Simpan gambar lama sebelum resize jika ada
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0);

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Default background putih solid
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Pulihkan gambar sebelumnya jika ada
  if (tempCanvas.width > 0) {
    ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }
}

function clearCanvas() {
  const rect = canvas.getBoundingClientRect();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDraw(e) {
  e.preventDefault();
  isDrawing = true;
  lastPos = getPos(e);
}

function draw(e) {
  if (!isDrawing || !lastPos) return;
  e.preventDefault();

  const currentPos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastPos.x, lastPos.y);
  ctx.lineTo(currentPos.x, currentPos.y);
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  lastPos = currentPos;
}

function stopDraw(e) {
  if (isDrawing) {
    isDrawing = false;
    lastPos = null;
  }
}

// Pasang listener mouse & touch
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDraw);
canvas.addEventListener("touchcancel", stopDraw);

document.getElementById("btn-clear-canvas").addEventListener("click", clearCanvas);

// ─── 5. Panggilan API Roboflow (Klasifikasi / Workflows)
const btnCheck = document.getElementById("btn-check-drawing");

async function checkDrawing() {
  if (isChecking) return;

  // Cek apakah API Key sudah diisi
  if (!config.apiKey || !config.modelUrl) {
    openSettingsModal();
    alert("Silakan masukkan Roboflow API Key dan Model URL Anda terlebih dahulu di menu Pengaturan!");
    return;
  }

  isChecking = true;
  btnCheck.disabled = true;
  btnCheck.innerHTML = `
    <svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
    <span>Memeriksa dengan AI...</span>
  `;

  try {
    // Konversi gambar kanvas ke Base64 (tanpa prefix data URI)
    const dataUrl = canvas.toDataURL("image/png");
    const base64Value = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const expectedClass = selectedLetter.id; // alif, ba, ta, tsa, jim

    let topPrediction = "";
    let confidence = 0;

    // Deteksi jenis URL Roboflow: Workflows atau Standard Inference
    if (config.modelUrl.includes("serverless.roboflow.com")) {
      // 1. Roboflow Serverless Workflows API
      const response = await fetch(config.modelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: config.apiKey,
          inputs: {
            image: {
              type: "base64",
              value: base64Value
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Roboflow Workflows Error (${response.status}): ${errorText}`);
      }

      const resJson = await response.json();
      const modelOutput = resJson?.outputs?.[0]?.model_output;
      if (!modelOutput) {
        throw new Error("Format respons Roboflow Workflows tidak sesuai.");
      }

      topPrediction = (modelOutput.top || "").toLowerCase();
      confidence = Number(modelOutput.confidence || 0);

    } else {
      // 2. Roboflow Hosted Model (Classify / Detect API)
      let requestUrl = config.modelUrl;
      const delimiter = requestUrl.includes("?") ? "&" : "?";
      if (!requestUrl.includes("api_key=")) {
        requestUrl += `${delimiter}api_key=${encodeURIComponent(config.apiKey)}`;
      }

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: base64Value
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Roboflow Infer Error (${response.status}): ${errorText}`);
      }

      const resJson = await response.json();
      
      // Handle classification / object detection output
      if (resJson.top) {
        topPrediction = resJson.top.toLowerCase();
        confidence = Number(resJson.confidence || 0);
      } else if (resJson.predictions && resJson.predictions.length > 0) {
        const first = resJson.predictions[0];
        topPrediction = (first.class || "").toLowerCase();
        confidence = Number(first.confidence || 0);
      } else {
        throw new Error("Tidak ada prediksi yang dihasilkan oleh model.");
      }
    }

    // Evaluasi hasil prediksi terhadap huruf yang dipilih
    // Normalisasi string (misal: "alif" == "alif")
    const isSuccess = topPrediction.includes(expectedClass) || expectedClass.includes(topPrediction);

    showResultModal(isSuccess, topPrediction, confidence);

  } catch (err) {
    console.error("CHECK_ERROR:", err);
    alert("Gagal melakukan prediksi:\n" + err.message);
  } finally {
    isChecking = false;
    btnCheck.disabled = false;
    btnCheck.innerHTML = `<span>Periksa Tulisan</span>`;
  }
}

btnCheck.addEventListener("click", checkDrawing);

// ─── 6. Modal Hasil Prediksi (Popup Kucing & Akurasi) ────────────────────────
const resultModalEl = document.getElementById("result-modal");
const modalCatImg = document.getElementById("modal-cat-img");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalLetterName = document.getElementById("modal-letter-name");
const predClassEl = document.getElementById("pred-class");
const predConfidenceEl = document.getElementById("pred-confidence");

function showResultModal(success, topPrediction, confidence) {
  modalCatImg.src = success ? "./assets/images/cat-true.png" : "./assets/images/cat-false.png";
  modalTitle.textContent = success ? "Yeayy tulisanmu tepat!" : "Yahh tulisanmu belum sesuai!";
  modalLetterName.textContent = selectedLetter.label;

  if (success) {
    modalMessage.innerHTML = `Tulisan udah mirip banget sama huruf <span class="font-bold text-brand">${selectedLetter.label}</span>. Ayo tuliskan lagi huruf yang sama atau coba huruf lainnya!`;
  } else {
    modalMessage.innerHTML = `Tulisan kamu masih belum mirip dengan <span class="font-bold text-brand">${selectedLetter.label}</span>. Ayo tuliskan lagi huruf yang sama atau coba huruf lainnya!`;
  }

  predClassEl.textContent = topPrediction || "-";
  predConfidenceEl.textContent = `${(confidence * 100).toFixed(1)}%`;

  resultModalEl.classList.remove("hidden");
}

function closeResultModal() {
  resultModalEl.classList.add("hidden");
}

document.getElementById("btn-modal-close").addEventListener("click", closeResultModal);
document.getElementById("btn-modal-retry").addEventListener("click", () => {
  closeResultModal();
  clearCanvas();
});

// ─── 7. Modal Pengaturan Roboflow (Settings) ─────────────────────────────────
const settingsModalEl = document.getElementById("settings-modal");
const inputApiKey = document.getElementById("input-api-key");
const inputModelUrl = document.getElementById("input-model-url");

function openSettingsModal() {
  inputApiKey.value = config.apiKey;
  inputModelUrl.value = config.modelUrl;
  settingsModalEl.classList.remove("hidden");
}

function closeSettingsModal() {
  settingsModalEl.classList.add("hidden");
}

document.getElementById("btn-open-settings").addEventListener("click", openSettingsModal);
document.getElementById("btn-close-settings-x").addEventListener("click", closeSettingsModal);
document.getElementById("btn-cancel-settings").addEventListener("click", closeSettingsModal);

document.getElementById("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const newKey = inputApiKey.value.trim();
  const newUrl = inputModelUrl.value.trim();

  config.apiKey = newKey;
  config.modelUrl = newUrl;

  localStorage.setItem("ROBOFLOW_API_KEY", newKey);
  localStorage.setItem("ROBOFLOW_MODEL_URL", newUrl);

  closeSettingsModal();
  alert("Pengaturan Roboflow berhasil disimpan!");
});

// ─── 8. Inisialisasi Saat Halaman Dimuat ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  await initConfig();
  renderLetterButtons();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});
