const $ = (selector) => document.querySelector(selector);

let userName = localStorage.userName || "";
let balance = 0;
let videoIndex = 0;
let videoUnlocked = false;
let spinCount = 0;
let reviewVideoIndex = 0;

const videoFiles = ["1t.mp4", "2t.mp4", "3t.mp4", "4t.mp4"];
const rewards = [44.6, 44.6, 44.6, 44.6];

const reactions = [
    ["🔥", "VIRAL"],
    ["🚀", "TOP"],
    ["👍", "NOT BAD"],
    ["😐", "MEH"],
    ["⚠️", "DANGER"],
    ["👎", "FLOP"]
];


function stopAllVideos(){
    document.querySelectorAll("video").forEach((video) => {
        try{
            video.pause();

            if(video.id !== "finalVideo"){
                video.currentTime = 0;
            }
        }catch(error){}
    });
}

function go(id){
    stopAllVideos();

    document
        .querySelectorAll(".page")
        .forEach((page) => page.classList.remove("active"));

    $("#" + id).classList.add("active");

    history.replaceState(null, "", location.pathname);
    window.scrollTo(0, 0);

    const scrollApp = $("#" + id + " .app.scroll");

    if(scrollApp){
        scrollApp.scrollTop = 0;
    }

    window.currentPage = id;

    updateWithdrawToastsForPage(id);

    if(id === "video"){
        loadVideo();
    }

    if(id === "spin"){
        setupSpin();
    }

    if(id === "final"){
        setupFinal();
    }
}

function syncName(){
    const raw = userName || "Name";
    const shortName = raw.length > 12 ? raw.slice(0, 12) + "…" : raw;

    $("#who").textContent = shortName;
    $("#who2").textContent = shortName;
    $("#initial").textContent = raw[0].toUpperCase();
    $("#userBadge").textContent = raw[0].toUpperCase();
}

function route(){
    go("home");
}

setInterval(() => {
    $("#online").textContent =
        (5180 + Math.floor(Math.random() * 160)).toLocaleString("ru-RU");
}, 1600);

$("#name").addEventListener("input", (event) => {
    userName = event.target.value.trim();

    event.target.classList.toggle("filled", Boolean(userName));

    $("#continue").disabled = !userName;
});

$("#continue").onclick = () => {
    localStorage.userName = userName;

    syncName();
    go("selected");
};

function renderChoices(){
    const box = $("#choices");

    box.innerHTML = "";

    reactions.forEach((reaction) => {
        const button = document.createElement("button");

        button.className = "reaction";
        button.disabled = true;
        button.innerHTML = "<b>" + reaction[0] + "</b>" + reaction[1];
        button.onclick = () => chooseReaction(button);

        box.appendChild(button);
    });
}

function renderProgress(){
    const progress = $("#progress");

    progress.innerHTML = "";

    for(let i = 0; i < videoFiles.length; i++){
        const segment = document.createElement("span");

        segment.className = "seg" + (i <= videoIndex ? " on" : "");

        progress.appendChild(segment);
    }
}

function setReactionsEnabled(enabled){
    videoUnlocked = enabled;

    document.querySelectorAll(".reaction").forEach((button) => {
        button.disabled = !enabled;
        button.style.pointerEvents = enabled ? "auto" : "none";
    });

    $("#readyText").textContent = enabled ? "Ready!" : "Locked";
    $("#watchLock").classList.toggle("hide", enabled);

    if(!enabled){
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

function loadVideo(){
    const video = $("#rewardVideo");
    const lock = $("#watchLock");

    renderProgress();

    $("#videoCounter").textContent =
        videoIndex + 1 + "/" + videoFiles.length;

    $("#rewardTop").textContent = Math.round(rewards[videoIndex]);
    $("#bal").textContent = balance.toFixed(2);

    video.src = videoFiles[videoIndex];
    video.load();

    setReactionsEnabled(false);

    $("#videoLine").style.width = "0%";
    $("#playIcon").textContent = "▶";
    $("#lockText").textContent = "Tap to play video";
    $("#lockSub").textContent = "Reactions unlock after the video ends";

    clearInterval(window.videoUnlockTimer);

    try{
        video.pause();
        video.currentTime = 0;
    }catch(error){}

    const unlock = () => {
        clearInterval(window.videoUnlockTimer);

        setReactionsEnabled(true);

        $("#videoLine").style.width = "100%";
    };

    video.onended = unlock;

    video.ontimeupdate = () => {
        if(video.duration && isFinite(video.duration)){
            $("#videoLine").style.width =
                Math.min(100, (video.currentTime / video.duration) * 100) + "%";
        }

        if(video.currentTime >= 5 && !videoUnlocked){
            unlock();
            $("#readyText").textContent = "Ready after 5 sec!";
        }
    };

    video.onerror = () => {
        $("#playIcon").textContent = "⚠️";
        $("#lockText").textContent = "Video not found";
        $("#lockSub").textContent =
            "Place " + videoFiles[videoIndex] + " next to index.html";
    };

    lock.onclick = async (event) => {
        event.preventDefault();

        if(videoUnlocked){
            return;
        }

        lock.style.pointerEvents = "none";

        $("#playIcon").textContent = "⏳";
        $("#lockText").textContent = "Video is starting...";
        $("#lockSub").textContent = "Wait until the video finishes";

        try{
            video.currentTime = 0;
            video.muted = false;
            video.volume = 1;

            await video.play();

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
                if(video.currentTime >= 5 && !videoUnlocked){
                    unlock();
                    $("#readyText").textContent = "Ready after 5 sec!";
                }
            }, 100);
        }catch(error){
            lock.style.pointerEvents = "auto";
            $("#playIcon").textContent = "▶";
            $("#lockText").textContent = "Video failed to start";
            $("#lockSub").textContent = "Check video file path";
        }
    };
}

function chooseReaction(button){
    if(!videoUnlocked){
        return;
    }

    document
        .querySelectorAll(".reaction")
        .forEach((item) => item.classList.remove("active"));

    button.classList.add("active");

    const reward = rewards[videoIndex];

    balance += reward;

    $("#bal").textContent = balance.toFixed(2);
    $("#modalReward").textContent = Math.round(reward);
    $("#modalCash").textContent = reward.toFixed(2);

    $("#nextVideo").textContent =
        videoIndex < videoFiles.length - 1
            ? (videoFiles.length - videoIndex - 1) + " more video to evaluate →"
            : "Open bonus wheel →";

    $("#rewardModal").classList.add("show");
}

$("#nextVideo").onclick = () => {
    $("#rewardModal").classList.remove("show");

    if(videoIndex < videoFiles.length - 1){
        videoIndex++;

        loadVideo();
    }else{
        balance = 178.4;

        go("spin");
    }
};

const ranks = [
    ["1", "Marie L. 🇺🇸 👑", "$9,847", "ML"],
    ["2", "Thomas P. 🇺🇸 💎", "$8,523", "TP"],
    ["3", "Lea M. 🇺🇸 🔥", "$7,105", "LM"],
    ["4", "Nicolas D. 🇺🇸 ⭐", "$6,289", "ND"],
    ["5", "Camille B. 🇺🇸 ⭐", "$5,534", "CB"]
];

const withdrawals = [
    ["Jessica M.", "PayPal · Jan 15, 2025", "$1,240.00"],
    ["Brandon K.", "CashApp · Jan 14, 2025", "$890.50"],
    ["Logan S.", "Bank Transfer · just now", "$351.00"],
    ["Isabella R.", "PayPal · 2 min ago", "$2,862.00"],
    ["Mia C.", "PayPal · 5 min ago", "$1,840.00"],
    ["David L.", "Zelle · 18 min ago", "$4,021.00"]
];

const reviews = [
    ["Julia S.", "1 day ago", "Got my first withdrawal in 24 hours! Amazing program."],
    ["Mark T.", "2 days ago", "Easy to use, fast payments. Highly recommend!"],
    ["Sophie R.", "3 days ago", "Great platform. Wish I found it sooner."],
    ["Lucas P.", "5 days ago", "Already made over $2,000 this month. Legit!"]
];

function fillLists(){
    const rankHtml = ranks
        .map((rank) => `
            <div class="rank-row">
                <div class="rank-num">${rank[0]}</div>

                <div class="rank-person">
                    <div class="rank-avatar">${rank[3]}</div>

                    <div>
                        <div class="rank-name">${rank[1]}</div>
                        <div class="verified">✅ Verified</div>
                    </div>
                </div>

                <div class="rank-money">
                    ${rank[2]}<br>
                    <small class="muted">this month</small>
                </div>
            </div>
        `)
        .join("");

    const withdrawHtml = withdrawals
        .map((withdraw) => `
            <div class="row">
                <div>
                    <b>${withdraw[0]}</b><br>
                    <span class="muted">${withdraw[1]}</span>
                </div>

                <div class="money cyan">${withdraw[2]}</div>
            </div>
        `)
        .join("");

    const reviewHtml =
        '<div class="reviews-grid">' +
        reviews
            .map((review) => `
                <div class="review-card">
                    <b>${review[0]}</b>
                    <span class="muted" style="float:right">${review[1]}</span><br>
                    ⭐⭐⭐⭐⭐
                    <p class="muted" style="margin:8px 0 0">
                        ${review[2]}
                    </p>
                </div>
            `)
            .join("") +
        "</div>";

    ["finalRankList"].forEach((id) => {
        const element = $("#" + id);

        if(element){
            element.innerHTML = rankHtml;
        }
    });

    ["finalWithdrawList"].forEach((id) => {
        const element = $("#" + id);

        if(element){
            element.innerHTML = withdrawHtml;
        }
    });

    ["finalReviewList"].forEach((id) => {
        const element = $("#" + id);

        if(element){
            element.innerHTML = reviewHtml;
        }
    });
}

document.addEventListener("click", (event) => {
    if(event.target.classList.contains("tab")){
        const wrap = event.target.closest(".review-wrap");

        wrap
            .querySelectorAll(".tab")
            .forEach((tab) => tab.classList.remove("active"));

        wrap
            .querySelectorAll(".panel")
            .forEach((panel) => panel.classList.remove("active"));

        event.target.classList.add("active");

        $("#" + event.target.dataset.tab).classList.add("active");
    }
});

function setupSpin(){
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

function spinWheel(){
    spinCount++;

    $("#spinBtn").disabled = true;

    const firstSpin = spinCount === 1;

    $("#wheel").style.transform =
        firstSpin ? "rotate(1755deg)" : "rotate(3915deg)";

    setTimeout(() => {
        if(firstSpin){
            $("#spinNote").classList.remove("hidden");
            $("#spinBtn").disabled = false;
            $("#spinBtn").textContent = " FREE BONUS SPIN!";
        }else{
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

document.addEventListener("click", (event) => {
    const wheel = event.target.closest("#wheel");

    if(!wheel){
        return;
    }

    const spinBtn = document.getElementById("spinBtn");

    if(spinBtn && !spinBtn.disabled){
        spinBtn.click();
    }
});

function animateCounter(id, start, end, duration, format){
    const element = document.getElementById(id);

    if(!element){
        return;
    }

    const startTime = performance.now();

    function tick(now){
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = start + (end - start) * eased;

        element.textContent = format(value);

        if(progress < 1){
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

function startFinalStats(){
    animateCounter("paidStat", 1.84, 2.17, 2600, (value) => "$" + value.toFixed(2) + "M");
    animateCounter("usersStat", 286, 347, 2800, (value) => Math.round(value) + "K");
    animateCounter("ratingStat", 4.8, 4.9, 2400, (value) => value.toFixed(1));

    clearInterval(window.watchingTimer);

    window.watchingTimer = setInterval(() => {
        const number = 540 + Math.floor(Math.random() * 85);
        const element = document.getElementById("watchingNow");

        if(element){
            element.textContent = number;
        }
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
    "Sophia L."
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
    "San Diego"
];

function randomWithdrawAmount(){
    return (16 + Math.random() * (850 - 16)).toFixed(2);
}

function showWithdrawToast(){
    const box = document.getElementById("withdrawToast");

    if(!box || window.currentPage === "home"){
        return;
    }

    const name =
        toastPeople[Math.floor(Math.random() * toastPeople.length)];

    const city =
        toastCities[Math.floor(Math.random() * toastCities.length)];

    const amount = randomWithdrawAmount();

    box.innerHTML = `
        <div class="withdraw-toast-avatar"></div>

        <div>
            <div class="withdraw-toast-name">${name}</div>
            <div class="withdraw-toast-city">${city}</div>
        </div>

        <div class="withdraw-toast-amount">+$${amount}</div>
    `;

    box.classList.add("show");

    clearTimeout(window.toastHideTimer);

    window.toastHideTimer = setTimeout(() => {
        box.classList.remove("show");
    }, 2200);
}

function startWithdrawToasts(){
    const box = document.getElementById("withdrawToast");

    if(!box){
        return;
    }

    clearTimeout(window.toastTimer);

    if(window.currentPage === "home"){
        box.classList.remove("show");
        return;
    }

    function scheduleNextToast(){
        const randomDelay = Math.floor(Math.random() * 3000) + 5000;

        window.toastTimer = setTimeout(() => {
            showWithdrawToast();
            scheduleNextToast();
        }, randomDelay);
    }

    scheduleNextToast();
}

function updateWithdrawToastsForPage(id){
    const box = document.getElementById("withdrawToast");

    if(!box){
        return;
    }

    if(id === "home"){
        box.classList.remove("show");

        clearTimeout(window.toastTimer);
        clearTimeout(window.toastHideTimer);

        return;
    }

    startWithdrawToasts();
}

function setupFinal(){
    fillLists();
    startFinalStats();
    setupReviewVideoCarousel();

    const video = document.getElementById("finalVideo");

    if(!video){
        return;
    }

    video.controls = false;
    video.loop = false;
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.onpause = null;
    video.onended = null;

    try{
        video.pause();
        video.currentTime = 0;
    }catch(error){}

    const playFinalVideo = () => {
        if(window.currentPage !== "final"){
            return;
        }

        video.muted = false;
        video.volume = 1;

        video.play().catch(() => {});
    };

    video.onended = () => {
        video.pause();
    };

    playFinalVideo();

    setTimeout(playFinalVideo, 300);
    setTimeout(playFinalVideo, 800);
}

function setupReviewVideoCarousel(){
    const cards = Array.from(document.querySelectorAll(".review-video-card"));

    if(!cards.length){
        return;
    }

    const prevBtn = document.querySelector(".review-video-nav.prev");
    const nextBtn = document.querySelector(".review-video-nav.next");

    function stopAllVideos(){
        cards.forEach((card) => {
            const video = card.querySelector("video");
            const play = card.querySelector(".review-video-play");

            if(video){
                video.pause();
                video.currentTime = 0;
                video.muted = false;
                video.volume = 1;
            }

            if(play){
                play.classList.remove("hide");
            }
        });
    }

    function showCard(index){
        reviewVideoIndex =
            (index + cards.length) % cards.length;

        stopAllVideos();

        cards.forEach((card, cardIndex) => {
            card.classList.toggle("active", cardIndex === reviewVideoIndex);
        });
    }

    cards.forEach((card) => {
        const video = card.querySelector("video");
        const play = card.querySelector(".review-video-play");

        if(video){
            video.controls = false;
            video.muted = false;
            video.volume = 1;
            video.playsInline = true;
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", "");
        }

        if(play && video){
            play.onclick = () => {
                stopAllVideos();

                card.classList.add("active");
                play.classList.add("hide");

                video.muted = false;
                video.volume = 1;
                video.play().catch(() => {});
            };
        }
    });

    if(prevBtn){
        prevBtn.onclick = () => {
            showCard(reviewVideoIndex - 1);
        };
    }

    if(nextBtn){
        nextBtn.onclick = () => {
            showCard(reviewVideoIndex + 1);
        };
    }

    showCard(reviewVideoIndex);
}

renderChoices();
syncName();
route();

(function(){
    "use strict";

    let verificationTimer = null;
    let selectedWasActive = false;

    function activePageId(){
        const page = document.querySelector(".page.active");

        return page ? page.id : "";
    }

    function finishVerification(){
        const page = document.getElementById("selected");
        const verify = page && page.querySelector(".verify");
        const button = document.getElementById("verifyContinue");

        if(!verify || !button){
            return;
        }

        const title = verify.querySelector("h3");
        const checks = verify.querySelectorAll(".check");

        verify.classList.remove("js-running");
        verify.classList.add("is-done");

        if(title){
            title.textContent = "✅ PROFILE VERIFIED";
        }

        checks.forEach((item) => {
            item.style.opacity = "1";
        });

        button.disabled = false;
        button.removeAttribute("disabled");
        button.textContent = "CONTINUE ❯";
        button.style.pointerEvents = "auto";
        button.style.opacity = "1";
        button.style.filter = "none";
        button.setAttribute("aria-disabled", "false");

        button.onclick = () => {
            go("video");
        };
    }

    function startVerification(){
        const page = document.getElementById("selected");
        const verify = page && page.querySelector(".verify");
        const button = document.getElementById("verifyContinue");

        if(!verify || !button){
            return;
        }

        clearTimeout(verificationTimer);

        button.disabled = true;
        button.setAttribute("disabled", "disabled");
        button.setAttribute("aria-disabled", "true");
        button.textContent = "VERIFYING...";
        button.style.pointerEvents = "none";

        verify.classList.remove("is-done", "js-running");

        const title = verify.querySelector("h3");

        if(title){
            title.textContent = "♢ PROFILE VERIFICATION";
        }

        const checks = verify.querySelectorAll(".check");

        checks.forEach((item) => {
            item.style.opacity = "0.45";
        });

        void verify.offsetWidth;

        verify.classList.add("js-running");

        [1000, 2200, 3400, 4600].forEach((delay, index) => {
            setTimeout(() => {
                if(activePageId() === "selected" && checks[index]){
                    checks[index].style.opacity = "1";
                }
            }, delay);
        });

        verificationTimer = setTimeout(finishVerification, 5000);
    }

    function watchSelectedPage(){
        const isSelected = activePageId() === "selected";

        if(isSelected && !selectedWasActive){
            startVerification();
        }

        selectedWasActive = isSelected;
    }

    function onStateChange(){
        watchSelectedPage();
    }

    window.addEventListener("load", () => {
        onStateChange();

        const pages = document.querySelectorAll(".page");

        pages.forEach((page) => {
            new MutationObserver(onStateChange).observe(page, {
                attributes:true,
                attributeFilter:["class"]
            });
        });
    });

    document.addEventListener(
        "click",
        () => {
            setTimeout(onStateChange, 60);
        },
        true
    );

    setInterval(() => {
        if(activePageId() === "selected"){
            const button = document.getElementById("verifyContinue");
            const verify = document.querySelector("#selected .verify");

            if(
                button &&
                verify &&
                verify.classList.contains("is-done") &&
                button.disabled
            ){
                finishVerification();
            }
        }
    }, 500);
})();

(function(){
    function forceVerifyButton(){
        const button = document.getElementById("verifyContinue");

        if(!button){
            return;
        }

        button.disabled = false;
        button.removeAttribute("disabled");
        button.classList.add("verify-force-active");
        button.textContent = "CONTINUE ❯";
        button.style.opacity = "1";
        button.style.pointerEvents = "auto";
        button.style.cursor = "pointer";

        button.onclick = (event) => {
            event.preventDefault();

            if(typeof window.go === "function"){
                window.go("video");
            }

            return false;
        };
    }

    forceVerifyButton();

    window.addEventListener("load", forceVerifyButton);
    document.addEventListener("DOMContentLoaded", forceVerifyButton);

    document.addEventListener(
        "click",
        () => {
            setTimeout(forceVerifyButton, 0);
        },
        true
    );

    setInterval(forceVerifyButton, 250);
})();
