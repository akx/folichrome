const config = new Config({ stops: "T4" }, "folichrome");
let data = {};
let error = null;
let showSettings = false;

function parseStops() {
  return (config.data.stops || "")
    .split(/[^a-z0-9]+/gi)
    .filter(s => s.length)
    .sort();
}

function refresh() {
  const stops = parseStops();
  if (!stops.length) {
    data = {};
    return Promise.resolve(true);
  }
  const newData = {};
  const promises = stops.map(stop =>
    fetch(`http://data.foli.fi/siri/sm/${stop}`)
      .then(r => r.json())
      .then(stopData => {
        newData[stop] = stopData;
      })
  );
  return Promise.all(promises)
    .then(() => {
      data = newData;
      error = null;
      m.redraw();
    })
    .catch(err => {
      data = {};
      error = err;
      m.redraw();
    });
}

function formatLine(i) {
  const d = new Date(i.expecteddeparturetime * 1000);
  const minutesToDeparture = (d - +new Date()) / 1000 / 60;
  if (minutesToDeparture < 0) return null;
  const sel = minutesToDeparture < 5 ? "tr.soon" : "tr";
  // prettier-ignore
  return m(sel, [
    m("td.stop", i.stop),
    m("td.line", i.lineref),
    m("td.dest", i.destinationdisplay),
    m("td.deptime", `${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`),
    m("td.mintodep", `\u25BB ${minutesToDeparture.toFixed(0)} min`),
  ]);
}

class FoliChrome {
  oninit(v) {
    config.load().then(() => {
      // Chrome gets confused when the layout of the popup changes too quickly.
      setTimeout(refresh, 150);
    });
    setInterval(refresh, 60000);
    setInterval(() => {
      if (!showSettings) m.redraw();
    }, 15000);
  }
  renderRegular() {
    const allInfo = Object.keys(data)
      .reduce((acc, stop) => acc.concat(data[stop].result.map(datum => Object.assign({ stop }, datum))), [])
      .sort((a, b) => a.expecteddeparturetime - b.expecteddeparturetime);
    const departureTable = allInfo.length
      ? m("table.departures", m("tbody", allInfo.map(formatLine)))
      : m("div.nodep", "No departures to show");

    const settingsBar = m(
      "div.bar",
      m(
        "button",
        {
          onclick() {
            showSettings = true;
          }
        },
        "Settings"
      )
    );
    return m("div", settingsBar, departureTable);
  }
  renderSettings() {
    return m("div.settings", [
      m("label", "Which stops do you want to show?"),
      m("input", {
        placeholder: "T4, 301",
        value: config.data.stops,
        oninput: m.withAttr("value", v => {
          config.data.stops = v;
        })
      }),
      m(
        "button",
        {
          onclick() {
            config.data.stops = parseStops(config.data.stops).join(", ");
            config.save();
            showSettings = false;
            refresh();
          }
        },
        "Save"
      )
    ]);
  }
  view() {
    const body = showSettings ? this.renderSettings() : this.renderRegular();
    return body;
  }
}

document.addEventListener("DOMContentLoaded", () => m.mount(document.body, FoliChrome));
