const $ = (s) => document.querySelector(s);
let userName = localStorage.userName || "";
let balance = 0;
let videoIndex = 0;
let videoUnlocked = false;
let spinCount = 0;
const videoFiles = ["1.mp4", "2.mp4"];
const rewards = [89, 89.4];
const reactions = [
  ["🔥", "VIRAL"],
  ["🚀", "TOP"],
  ["👍", "NOT BAD"],
  ["😐", "MEH"],
  ["⚠️", "DANGER"],
  ["👎", "FLOP"],
];
function go(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  $("#" + id).classList.add("active");
  history.replaceState(null, "", location.pathname);
  window.scrollTo(0, 0);
  const sc = $("#" + id + " .app.scroll");
  if (sc) sc.scrollTop = 0;
  window.currentPage = id;
  updateWithdrawToastsForPage(id);
  if (id === "video") loadVideo();
  if (id === "reviews") setupReviews();
  if (id === "spin") setupSpin();
  if (id === "final") setupFinal();
}
function syncName() {
  const raw = userName || "Name";
  const n = raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
  $("#who").textContent = n;
  $("#who2").textContent = n;
  $("#initial").textContent = raw[0].toUpperCase();
  $("#userBadge").textContent = raw[0].toUpperCase();
}
function route() {
  go("home");
}
setInterval(() => {
  $("#online").textContent = (
    5180 + Math.floor(Math.random() * 160)
  ).toLocaleString("ru-RU");
}, 1600);
$("#name").addEventListener("input", (e) => {
  userName = e.target.value.trim();
  e.target.classList.toggle("filled", !!userName);
  $("#continue").disabled = !userName;
});
$("#continue").onclick = () => {
  localStorage.userName = userName;
  syncName();
  go("selected");
};
function renderChoices() {
  const box = $("#choices");
  box.innerHTML = "";
  reactions.forEach((c) => {
    const b = document.createElement("button");
    b.className = "reaction";
    b.disabled = true;
    b.innerHTML = "<b>" + c[0] + "</b>" + c[1];
    b.onclick = () => chooseReaction(b);
    box.appendChild(b);
  });
}
function renderProgress() {
  const p = $("#progress");
  p.innerHTML = "";
  for (let i = 0; i < 2; i++) {
    const s = document.createElement("span");
    s.className = "seg" + (i <= videoIndex ? " on" : "");
    p.appendChild(s);
  }
}
function setReactionsEnabled(on) {
  videoUnlocked = on;
  document.querySelectorAll(".reaction").forEach((b) => {
    b.disabled = !on;
    b.style.pointerEvents = on ? "auto" : "none";
  });
  $("#readyText").textContent = on ? "Ready!" : "Locked";
  $("#watchLock").classList.toggle("hide", on);
  if (!on) {
    $("#watchLock").style.background = "rgba(0,0,0,.35)";
    $("#watchLock").style.pointerEvents = "auto";
    $("#playIcon").style.display = "grid";
    $("#playIcon").style.opacity = "1";
    $("#lockText").style.display = "block";
    $("#lockSub").style.display = "inline";
    $("#lockText").style.opacity = "1";
    $("#lockSub").style.opacity = "1";
  }
}
function loadVideo() {
  const v = $("#rewardVideo");
  const lock = $("#watchLock");
  renderProgress();
  $("#videoCounter").textContent = videoIndex + 1 + "/2";
  $("#rewardTop").textContent = Math.round(rewards[videoIndex]);
  $("#bal").textContent = balance.toFixed(2);
  v.src = videoFiles[videoIndex];
  v.load();
  setReactionsEnabled(false);
  $("#videoLine").style.width = "0%";
  $("#playIcon").textContent = "▶";
  $("#lockText").textContent = "Tap to play video";
  $("#lockSub").textContent = "Reactions unlock after the video ends";
  clearInterval(window.videoUnlockTimer);
  try {
    v.pause();
    v.currentTime = 0;
  } catch (e) {}
  const unlock = () => {
    clearInterval(window.videoUnlockTimer);
    setReactionsEnabled(true);
    $("#videoLine").style.width = "100%";
  };
  v.onended = unlock;
  v.ontimeupdate = () => {
    if (v.duration && isFinite(v.duration)) {
      $("#videoLine").style.width =
        Math.min(100, (v.currentTime / v.duration) * 100) + "%";
      if (v.currentTime >= v.duration - 0.15) unlock();
    }
  };
  v.onerror = () => {
    $("#playIcon").textContent = "⚠️";
    $("#lockText").textContent = "Video not found";
    $("#lockSub").textContent =
      "Place " + videoFiles[videoIndex] + " next to index.html";
  };
  lock.onclick = async (e) => {
    e.preventDefault();
    if (videoUnlocked) return;
    lock.style.pointerEvents = "none";
    $("#playIcon").textContent = "⏳";
    $("#lockText").textContent = "Video is starting...";
    $("#lockSub").textContent = "Wait until the video finishes";
    try {
      v.currentTime = 0;
      v.muted = true;
      await v.play();
      $("#playIcon").style.opacity = "0";
      $("#lockText").style.opacity = "0";
      $("#lockSub").style.opacity = "0";
      setTimeout(() => {
        lock.style.background = "rgba(0,0,0,0)";
        $("#playIcon").style.display = "none";
        $("#lockText").style.display = "none";
        $("#lockSub").style.display = "none";
      }, 250);
      window.videoUnlockTimer = setInterval(() => {
        if (v.duration && v.currentTime >= v.duration - 0.12) unlock();
      }, 100);
    } catch (err) {
      lock.style.pointerEvents = "auto";
      $("#playIcon").textContent = "▶";
      $("#lockText").textContent = "Video failed to start";
      $("#lockSub").textContent = "Check video file path";
    }
  };
}
function chooseReaction(btn) {
  if (!videoUnlocked) return;
  document
    .querySelectorAll(".reaction")
    .forEach((x) => x.classList.remove("active"));
  btn.classList.add("active");
  const reward = rewards[videoIndex];
  balance += reward;
  $("#bal").textContent = balance.toFixed(2);
  $("#modalReward").textContent = Math.round(reward);
  $("#modalCash").textContent = reward.toFixed(2);
  $("#nextVideo").textContent =
    videoIndex < 1 ? "1 more video to evaluate →" : "Open results page →";
  $("#rewardModal").classList.add("show");
}
$("#nextVideo").onclick = () => {
  $("#rewardModal").classList.remove("show");
  if (videoIndex < 1) {
    videoIndex++;
    loadVideo();
  } else {
    balance = 178.4;
    go("spin");
  }
};
const ranks = [
  ["1", "Marie L. 🇺🇸 👑", "$9,847", "ML"],
  ["2", "Thomas P. 🇺🇸 💎", "$8,523", "TP"],
  ["3", "Lea M. 🇺🇸 🔥", "$7,105", "LM"],
  ["4", "Nicolas D. 🇺🇸 ⭐", "$6,289", "ND"],
  ["5", "Camille B. 🇺🇸 ⭐", "$5,534", "CB"],
];
const withdrawals = [
  ["Jessica M.", "PayPal · Jan 15, 2025", "$1,240.00"],
  ["Brandon K.", "CashApp · Jan 14, 2025", "$890.50"],
  ["Logan S.", "Bank Transfer · just now", "$351.00"],
  ["Isabella R.", "PayPal · 2 min ago", "$2,862.00"],
  ["Mia C.", "PayPal · 5 min ago", "$1,840.00"],
  ["David L.", "Zelle · 18 min ago", "$4,021.00"],
];
const reviews = [
  [
    "Julia S.",
    "1 day ago",
    "Got my first withdrawal in 24 hours! Amazing program.",
  ],
  ["Mark T.", "2 days ago", "Easy to use, fast payments. Highly recommend!"],
  ["Sophie R.", "3 days ago", "Great platform. Wish I found it sooner."],
  ["Lucas P.", "5 days ago", "Already made over $2,000 this month. Legit!"],
];
function setupReviews() {
  balance = 178.4;
  $("#reviewBal").textContent = balance.toFixed(2);
  fillLists();
}
function fillLists() {
  const rankHtml = ranks
    .map(
      (r) =>
        `<div class="rank-row"><div class="rank-num">${r[0]}</div><div class="rank-person"><div class="rank-avatar">${r[3]}</div><div><div class="rank-name">${r[1]}</div><div class="verified">✅ Verified</div></div></div><div class="rank-money">${r[2]}<br><small class="muted">this month</small></div></div>`,
    )
    .join("");
  const withdrawHtml = withdrawals
    .map(
      (w) =>
        `<div class="row"><div><b>${w[0]}</b><br><span class="muted">${w[1]}</span></div><div class="money cyan">${w[2]}</div></div>`,
    )
    .join("");
  const reviewHtml =
    '<div class="reviews-grid">' +
    reviews
      .map(
        (r) =>
          `<div class="review-card"><b>${r[0]}</b><span class="muted" style="float:right">${r[1]}</span><br>⭐⭐⭐⭐⭐<p class="muted" style="margin:8px 0 0">${r[2]}</p></div>`,
      )
      .join("") +
    "</div>";
  ["rankList", "finalRankList"].forEach((id) => {
    $("#" + id).innerHTML = rankHtml;
  });
  ["withdrawList", "finalWithdrawList"].forEach((id) => {
    $("#" + id).innerHTML = withdrawHtml;
  });
  ["reviewList", "finalReviewList"].forEach((id) => {
    $("#" + id).innerHTML = reviewHtml;
  });
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("tab")) {
    const wrap = e.target.closest(".review-wrap");
    wrap.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    wrap
      .querySelectorAll(".panel")
      .forEach((x) => x.classList.remove("active"));
    e.target.classList.add("active");
    $("#" + e.target.dataset.tab).classList.add("active");
  }
});
function setupSpin() {
  spinCount = 0;
  $("#spinHeadBal").textContent = "178.40";
  $("#spinBal").textContent = "178.40";
  $("#spinNote").classList.add("hidden");
  $("#spinSuccess").classList.add("hidden");
  $("#wheel").style.transform = "rotate(0deg)";
  $("#spinBtn").disabled = false;
  $("#spinBtn").textContent = " SPIN TO MULTIPLY";
  $("#spinBtn").onclick = spinWheel;
}
function spinWheel() {
  spinCount++;
  $("#spinBtn").disabled = true;
  const first = spinCount === 1;
  $("#wheel").style.transform = first ? "rotate(1755deg)" : "rotate(3915deg)";
  setTimeout(() => {
    if (first) {
      $("#spinNote").classList.remove("hidden");
      $("#spinBtn").disabled = false;
      $("#spinBtn").textContent = " FREE BONUS SPIN!";
    } else {
      $("#spinBal").textContent = "356.80";
      $("#spinHeadBal").textContent = "356.80";
      $("#successAmount").textContent = "$356.80";
      $("#spinSuccess").classList.remove("hidden");
      $("#spinBtn").disabled = false;
      $("#spinBtn").textContent = "CONTINUE TO VIDEO TESTIMONIAL ❯";
      $("#spinBtn").onclick = () => go("final");
    }
  }, 4200);
}


/* Click on wheel duplicates spin button click */
document.addEventListener("click", function(e){
  const wheel = e.target.closest("#wheel");

  if(!wheel) return;

  const spinBtn = document.getElementById("spinBtn");

  if(spinBtn && !spinBtn.disabled){
    spinBtn.click();
  }
});

function animateCounter(id, start, end, duration, format) {
  const el = document.getElementById(id);
  if (!el) return;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (end - start) * eased;
    el.textContent = format(val);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function startFinalStats() {
  animateCounter("paidStat", 1.84, 2.17, 2600, (v) => "$" + v.toFixed(2) + "M");
  animateCounter("usersStat", 286, 347, 2800, (v) => Math.round(v) + "K");
  animateCounter("ratingStat", 4.8, 4.9, 2400, (v) => v.toFixed(1));
  clearInterval(window.watchingTimer);
  window.watchingTimer = setInterval(() => {
    const n = 540 + Math.floor(Math.random() * 85);
    const el = document.getElementById("watchingNow");
    if (el) el.textContent = n;
  }, 1800);
}
const toastPeople = [
  "James K.",
  "Emily R.",
  "Michael B.",
  "Sarah M.",
  "Daniel P.",
  "Olivia M.",
  "Chris W.",
  "Jessica H.",
  "Ryan T.",
  "Ashley C.",
  "Brandon S.",
  "Megan D.",
  "Liam H.",
  "Noah B.",
  "Ava R.",
  "Sophia L.",
];
const toastCities = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Miami",
  "Austin",
  "Boston",
  "Seattle",
  "Denver",
  "Phoenix",
  "Dallas",
  "Orlando",
  "San Diego",
];
function randomWithdrawAmount() {
  return (16 + Math.random() * (850 - 16)).toFixed(2);
}
function showWithdrawToast() {
  const box = document.getElementById("withdrawToast");
  if (!box || window.currentPage === "home") return;
  const name = toastPeople[Math.floor(Math.random() * toastPeople.length)];
  const city = toastCities[Math.floor(Math.random() * toastCities.length)];
  const amount = randomWithdrawAmount();
  box.innerHTML = `<div class="withdraw-toast-avatar"></div><div><div class="withdraw-toast-name">${name}</div><div class="withdraw-toast-city">${city}</div></div><div class="withdraw-toast-amount">+$${amount}</div>`;
  box.classList.add("show");
  clearTimeout(window.toastHideTimer);
  window.toastHideTimer = setTimeout(() => box.classList.remove("show"), 2200);
}

function startWithdrawToasts() {
  const box = document.getElementById("withdrawToast");

  if (!box) return;

  clearTimeout(window.toastTimer);

  if (window.currentPage === "home") {
    box.classList.remove("show");
    return;
  }

  function scheduleNextToast() {
    const randomDelay = Math.floor(Math.random() * 3000) + 5000;
    // 5000 - 8000 ms

    window.toastTimer = setTimeout(function () {
      showWithdrawToast();

      scheduleNextToast();
    }, randomDelay);
  }

  scheduleNextToast();
}

function updateWithdrawToastsForPage(id) {
  const box = document.getElementById("withdrawToast");
  if (!box) return;
  if (id === "home") {
    box.classList.remove("show");
    clearTimeout(window.toastTimer);
    clearTimeout(window.toastHideTimer);
    return;
  }
  startWithdrawToasts();
}

function setupFinal() {
  fillLists();
  startFinalStats();

  const video = document.getElementById("finalVideo");
  const playBtn = document.getElementById("finalPlayBtn");

  if (video) {
    video.controls = false;
    video.muted = false;
    video.volume = 1;
  }

  if (playBtn && video) {
    playBtn.onclick = function () {
      video.muted = false;
      video.volume = 1;
      video
        .play()
        .then(function () {
          playBtn.classList.add("hide");
        })
        .catch(function () {});
    };
  }
}
renderChoices();
syncName();
route();

/* ===== critical-verification-popup-script ===== */
(function () {
  "use strict";
  var verificationTimer = null;
  var selectedWasActive = false;
  function activePageId() {
    var p = document.querySelector(".page.active");
    return p ? p.id : "";
  }
  function finishVerification() {
    var page = document.getElementById("selected");
    var verify = page && page.querySelector(".verify");
    var btn = document.getElementById("verifyContinue");
    if (!verify || !btn) return;
    var h = verify.querySelector("h3");
    var checks = verify.querySelectorAll(".check");
    verify.classList.remove("js-running");
    verify.classList.add("is-done");
    if (h) h.textContent = "✅ PROFILE VERIFIED";
    checks.forEach(function (item) {
      item.style.opacity = "1";
    });
    btn.disabled = false;
    btn.removeAttribute("disabled");
    btn.textContent = "CONTINUE ❯";
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
    btn.style.filter = "none";
    btn.setAttribute("aria-disabled", "false");
    btn.onclick = function () {
      go("video");
    };
  }
  function startVerification() {
    var page = document.getElementById("selected");
    var verify = page && page.querySelector(".verify");
    var btn = document.getElementById("verifyContinue");
    if (!verify || !btn) return;
    clearTimeout(verificationTimer);
    btn.disabled = true;
    btn.setAttribute("disabled", "disabled");
    btn.setAttribute("aria-disabled", "true");
    btn.textContent = "VERIFYING...";
    btn.style.pointerEvents = "none";
    verify.classList.remove("is-done", "js-running");
    var h = verify.querySelector("h3");
    if (h) h.textContent = "♢ PROFILE VERIFICATION";
    var checks = verify.querySelectorAll(".check");
    checks.forEach(function (item) {
      item.style.opacity = "0.45";
    });
    void verify.offsetWidth;
    verify.classList.add("js-running");
    [1000, 2200, 3400, 4600].forEach(function (ms, i) {
      setTimeout(function () {
        if (activePageId() === "selected" && checks[i])
          checks[i].style.opacity = "1";
      }, ms);
    });
    verificationTimer = setTimeout(finishVerification, 5000);
  }
  function watchSelectedPage() {
    var isSelected = activePageId() === "selected";
    if (isSelected && !selectedWasActive) {
      startVerification();
    }
    selectedWasActive = isSelected;
  }

  var people = [
    "James K.",
    "Emily R.",
    "Michael B.",
    "Sarah M.",
    "Daniel P.",
    "Olivia M.",
    "Chris W.",
    "Jessica H.",
    "Ryan T.",
    "Ashley C.",
    "Brandon S.",
    "Megan D.",
    "Liam H.",
    "Noah B.",
    "Ava R.",
    "Sophia L.",
    "William C.",
    "Emma J.",
    "Mason P.",
    "Mia D.",
  ];
  var cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Miami",
    "Austin",
    "Boston",
    "Seattle",
    "Denver",
    "Phoenix",
    "Dallas",
    "Orlando",
    "San Diego",
    "Atlanta",
    "Houston",
    "Tampa",
    "Portland",
  ];
  var popup = null,
    popupTimer = null,
    hideTimer = null;
  function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
  }
  function amount() {
    return (16 + Math.random() * (850 - 16)).toFixed(2);
  }
  function ensurePopup() {
    if (popup && document.body.contains(popup)) return popup;
    popup = document.createElement("div");
    popup.className = "payout-popup-critical";
    popup.setAttribute("aria-live", "polite");
    document.body.appendChild(popup);
    return popup;
  }
  function shouldShowPopup() {
    var id = activePageId();
    return id && id !== "home";
  }
  function showPopup() {
    var box = ensurePopup();
    if (!shouldShowPopup()) {
      box.classList.remove("show");
      return;
    }
    var name = pick(people);
    box.innerHTML =
      '<div class="payout-popup-critical__avatar"><span>T</span></div><div><div class="payout-popup-critical__name">' +
      name +
      '</div><div class="payout-popup-critical__city">' +
      pick(cities) +
      '</div></div><div class="payout-popup-critical__amount">+$' +
      amount() +
      "</div>";
    box.classList.add("show");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      box.classList.remove("show");
    }, 2300);
  }
  function restartPopups() {
    ensurePopup();
    clearTimeout(popupTimer);
    clearTimeout(hideTimer);

    if (!shouldShowPopup()) {
      if (popup) popup.classList.remove("show");
      return;
    }

    function scheduleNextPopup() {
      const randomDelay = Math.floor(Math.random() * 3000) + 5000;

      popupTimer = setTimeout(function () {
        showPopup();
        scheduleNextPopup();
      }, randomDelay);
    }

    scheduleNextPopup();
  }
  function onStateChange() {
    watchSelectedPage();
    restartPopups();
  }
  window.addEventListener("load", function () {
    ensurePopup();
    onStateChange();
    var pages = document.querySelectorAll(".page");
    pages.forEach(function (p) {
      new MutationObserver(onStateChange).observe(p, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });
  });
  document.addEventListener(
    "click",
    function () {
      setTimeout(onStateChange, 60);
    },
    true,
  );
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) onStateChange();
  });
  setInterval(function () {
    if (activePageId() === "selected") {
      var btn = document.getElementById("verifyContinue");
      var verify = document.querySelector("#selected .verify");
      if (
        btn &&
        verify &&
        verify.classList.contains("is-done") &&
        btn.disabled
      ) {
        finishVerification();
      }
    }
  }, 500);
})();

(function () {
  function forceVerifyButton() {
    var btn = document.getElementById("verifyContinue");
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute("disabled");
    btn.classList.add("verify-force-active");
    btn.textContent = "CONTINUE ❯";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    btn.style.cursor = "pointer";
    btn.onclick = function (e) {
      e.preventDefault();
      if (typeof window.go === "function") {
        window.go("video");
      } else {
        document.querySelectorAll(".page").forEach(function (p) {
          p.classList.remove("active");
        });
        var v = document.getElementById("video");
        if (v) v.classList.add("active");
      }
      return false;
    };
  }
  forceVerifyButton();
  window.addEventListener("load", forceVerifyButton);
  document.addEventListener("DOMContentLoaded", forceVerifyButton);
  document.addEventListener(
    "click",
    function () {
      setTimeout(forceVerifyButton, 0);
    },
    true,
  );
  setInterval(forceVerifyButton, 250);
})();
