"use strict";

const clock = document.querySelector("#clock");
let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
let formatter;

try {
  formatter = new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
} catch {
  timeZone = "America/Toronto";
  formatter = new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function updateClock() {
  const now = new Date();
  const parts = Object.fromEntries(formatter.formatToParts(now).map(({ type, value }) => [type, value]));
  clock.textContent = `${parts.hour}:${parts.minute}:${parts.second}`;
  clock.dateTime = now.toISOString();
}

updateClock();
setInterval(updateClock, 1000);
