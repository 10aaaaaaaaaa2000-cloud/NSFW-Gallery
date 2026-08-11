const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];

const gallery = document.getElementById("gallery");
const statusEl = document.getElementById("status");

function isImageFile(filename) {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isVideoFile(filename) {
  const lower = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isMediaFile(filename) {
  return isImageFile(filename) || isVideoFile(filename);
}

function mimeTypeFor(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
  };
  return map[ext] || "application/octet-stream";
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function baseName(fullPath) {
  return fullPath.split("/").pop();
}

function createCard(mediaUrl, mediaName, archiveName) {
  const card = document.createElement("div");
  card.className = "card";

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "card-img-wrap";

  const isVideo = isVideoFile(mediaName);

  let mediaEl;
  if (isVideo) {
    mediaEl = document.createElement("video");
    mediaEl.src = mediaUrl;
    mediaEl.controls = true;
    mediaEl.preload = "metadata";
    mediaEl.playsInline = true;
    mediaEl.className = "card-video";
  } else {
    mediaEl = document.createElement("img");
    mediaEl.src = mediaUrl;
    mediaEl.alt = mediaName;
    mediaEl.loading = "lazy";
  }

  const downloadBtn = document.createElement("a");
  downloadBtn.href = mediaUrl;
  downloadBtn.download = mediaName;
  downloadBtn.className = "download-btn";
  downloadBtn.title = `Download ${mediaName}`;
  downloadBtn.setAttribute("aria-label", `Download ${mediaName}`);
  downloadBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  `;

  mediaWrap.appendChild(mediaEl);
  mediaWrap.appendChild(downloadBtn);

  if (isVideo) {
    const badge = document.createElement("span");
    badge.className = "media-badge";
    badge.textContent = "VIDEO";
    mediaWrap.appendChild(badge);
  }

  const info = document.createElement("div");
  info.className = "card-info";

  const name = document.createElement("p");
  name.className = "card-name";
  name.textContent = mediaName;

  const source = document.createElement("p");
  source.className = "card-source";
  source.textContent = `from ${archiveName}`;

  info.appendChild(name);
  info.appendChild(source);

  card.appendChild(mediaWrap);
  card.appendChild(info);

  return card;
}

async function processArchive(archivePath) {
  const archiveName = baseName(archivePath);
  setStatus(`Loading ${archiveName}...`);

  const response = await fetch(archivePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${archivePath}: ${response.status}`);
  }
  const blob = await response.arrayBuffer();

  const zip = await JSZip.loadAsync(blob);
  const mediaEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && isMediaFile(entry.name)
  );

  let count = 0;
  for (const entry of mediaEntries) {
    const data = await entry.async("blob");
    const typedBlob = new Blob([data], { type: mimeTypeFor(entry.name) });
    const url = URL.createObjectURL(typedBlob);
    const card = createCard(url, baseName(entry.name), archiveName);
    gallery.appendChild(card);
    count++;
  }

  return count;
}

async function loadAllArchives() {
  const archives = window.CONTENT_ARCHIVES || [];

  if (archives.length === 0) {
    setStatus(
      "No archives found. Add a .zip file to the /content folder and redeploy.",
      true
    );
    return;
  }

  let totalMedia = 0;
  let errors = 0;

  for (const archivePath of archives) {
    try {
      const count = await processArchive(archivePath);
      totalMedia += count;
    } catch (err) {
      console.error(err);
      errors++;
    }
  }

  if (totalMedia === 0) {
    setStatus(
      errors > 0
        ? "Found archive(s) but couldn't load them, or none contained images/videos."
        : "No images or videos found inside the archive(s).",
      true
    );
  } else {
    setStatus(
      `Loaded ${totalMedia} file${totalMedia === 1 ? "" : "s"} from ${
        archives.length
      } archive${archives.length === 1 ? "" : "s"}${errors ? ` (${errors} failed)` : ""}.`
    );
  }
}

// Scroll controls
document.getElementById("scrollTopBtn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("scrollBottomBtn").addEventListener("click", () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

loadAllArchives();