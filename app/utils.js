'use strict';

function pad(str) {
  return ('0' + str).slice(-2);
}

function formatDatetimeWithoutMinutesAndSeconds(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00:00`;
};

module.exports = { pad, formatDatetimeWithoutMinutesAndSeconds };
