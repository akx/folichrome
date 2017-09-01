const stops = ["T4", "456"];
const data = {};

function refresh() {
  const promises = stops.map(stop =>
    m
      .request({
        method: "GET",
        url: `http://data.foli.fi/siri/sm/${stop}`
      })
      .then(stopData => {
        data[stop] = stopData;
      })
  );
  return Promise.all(promises);
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

document.addEventListener("DOMContentLoaded", () => {
  m.mount(document.body, {
    oninit(v) {
      refresh();
    },
    view() {
      const allInfo = Object.keys(data)
        .reduce((acc, stop) => acc.concat(data[stop].result.map(datum => Object.assign({ stop }, datum))), [])
        .sort((a, b) => a.expecteddeparturetime - b.expecteddeparturetime);
      return m("div", m("table.departures", m("tbody", allInfo.map(formatLine))));
    }
  });
});
