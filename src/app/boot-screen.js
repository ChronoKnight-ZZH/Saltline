var bootElement = document.getElementById("boot");

var bootMessage = document.getElementById("boot-msg");

var bootProgress = document.getElementById("boot-fill");

var yieldToBrowser = () => new Promise((i) => setTimeout(i, 0));

async function setBootProgress(i, e) {
  (bootMessage && (bootMessage.textContent = i),
    bootProgress && (bootProgress.style.width = Math.round(e * 100) + "%"),
    await yieldToBrowser());
}

export {
  bootElement,
  setBootProgress,
  bootMessage,
  bootProgress,
  yieldToBrowser,
};
