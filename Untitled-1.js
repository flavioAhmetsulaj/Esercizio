// Importo una mappa e creo un marker per scegliere lat lon

function init() {
  let map = L.map("map").setView([45.4689, 10.535], 13);
  let lat = 0;
  let lon = 0;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var marker = L.marker([45.4689, 10.535]).addTo(map);

  map.on("click", function (e) {
    lat = e.latlng.lat;
    lon = e.latlng.lng;

    marker.setLatLng([lat, lon]);

    document.getElementById("lat").innerHTML = lat.toFixed(4);
    document.getElementById("lon").innerHTML = lon.toFixed(4);
  });
}

// ottengo i dati relativi alla posizione scelta su mappa
function fetchApi() {
  let lat = document.getElementById("lat").innerHTML;
  let lon = document.getElementById("lon").innerHTML;

  fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=" +
      lat +
      "&longitude=" +
      lon +
      "&hourly=temperature_2m,relativehumidity_2m,windspeed_10m"
  )
    .then((resp) => resp.json())
    .then((data) => handleData(data));
}
//gestisco i dati
function handleData(data) {
  const time = data.hourly.time;
  const temp = data.hourly.temperature_2m;
  const wind = data.hourly.windspeed_10m;
  const humid = data.hourly.relativehumidity_2m;
  const sortedArr = sortDays(time, temp, humid, wind);
  const dayArr = Object.values(divideDays(sortedArr));

  insertData(dayArr);
  buildChart(dayArr);
}
//riorganizzo i dati
function sortDays(arr, temp, humid, wind) {
  const aLeng = arr.length;
  let day = arr[0].slice(0, 10);
  let sortedArr = [];

  for (let i = 0; i < aLeng; i++) {
    if (day === arr[i].slice(0, 10)) {
      sortedArr.push({
        time: arr[i],
        temperature: temp[i],
        humidity: humid[i],
        windspeed: wind[i],
      });
    } else if (day !== arr[i].slice(0, 10)) {
      day = arr[i].slice(0, 10);
      sortedArr.push({
        time: arr[i],
        temperature: temp[i],
        humidity: humid[i],
        windspeed: wind[i],
      });
    }
  }

  return sortedArr;
}

function divideDays(sortedArr) {
  const dayArr = [];

  sortedArr.forEach((day) => {
    const key = day.time.slice(0, 10);
    if (!dayArr[key]) {
      dayArr[key] = [];
    }
    dayArr[key].push(day);
  });

  return dayArr;
}
// inserisco i dati nella tabella
function insertData(dayArr) {
  const table = document.getElementById("statistics");

  for (let i = 0; i < dayArr.length; i++) {
    const arr = dayArr[i];

    let day = arr[0].time.slice(0, 10);

    let minTemp = arr[0].temperature;
    let minHum = arr[0].humidity;
    let minWind = arr[0].windspeed;

    let maxTemp = arr[0].temperature;
    let maxHum = arr[0].humidity;
    let maxWind = arr[0].windspeed;

    let sumTemp = 0;
    let sumHum = 0;
    let sumWind = 0;

    let j = 0;

    for (j = 0; j < arr.length; j++) {
      if (arr[j].temperature < minTemp) minTemp = arr[j].temperature;
      if (arr[j].humidity < minHum) minHum = arr[j].humidity;
      if (arr[j].temperature < minWind) minTemp = arr[j].windspeed;

      if (arr[j].temperature > maxTemp) maxTemp = arr[j].temperature;
      if (arr[j].humidity > maxHum) maxHum = arr[j].humidity;
      if (arr[j].temperature > maxWind) maxTemp = arr[j].windspeed;

      sumTemp = sumTemp + arr[j].temperature;
      sumHum = sumHum + arr[j].humidity;
      sumWind = sumWind + arr[j].windspeed;
    }

    let avgTemp = sumTemp / j;
    let avgHum = sumHum / j;
    let avgWind = sumWind / j;

    let a = [
      day,
      minTemp.toFixed(1),
      avgTemp.toFixed(1),
      maxTemp.toFixed(1),
      minHum.toFixed(1),
      avgHum.toFixed(1),
      maxHum.toFixed(1),
      minWind.toFixed(1),
      avgWind.toFixed(1),
      maxWind.toFixed(1),
    ];

    const newLine = document.createElement("tr");

    a.forEach((item) => {
      const cell = document.createElement("td");
      cell.textContent = item;
      newLine.appendChild(cell);
    });

    table.appendChild(newLine);
  }
}
// creo i grafici
function buildChart(dayArr) {
  const time = [];
  const temperature = [];
  const windspeed = [];
  const humidity = [];

  const table = document.getElementById("statistics");

  const avgTemp = [];
  const avgHum = [];
  const avgWind = [];

  let columnTemp = table.querySelectorAll("tr td:nth-child(" + 3 + ")");
  let columnHum = table.querySelectorAll("tr td:nth-child(" + 6 + ")");
  let columnWind = table.querySelectorAll("tr td:nth-child(" + 9 + ")");

  columnTemp.forEach(function (cell) {
    avgTemp.push(cell.textContent);
  });

  columnHum.forEach(function (cell) {
    avgHum.push(cell.textContent);
  });

  columnWind.forEach(function (cell) {
    avgWind.push(cell.textContent);
  });

  for (let i = 0; i < dayArr.length; i++) {
    const arr = dayArr[i];
    time.push(arr[12].time);
    temperature.push(arr[12].temperature);
    humidity.push(arr[12].humidity);
    windspeed.push(arr[12].windspeed);
  }

  const ctxTemp = document.getElementById("temp").getContext("2d");

  const maxIndexTemp = temperature.indexOf(Math.max(...temperature));
  const minIndexTemp = temperature.indexOf(Math.min(...temperature));

  let chartTemp = {
    labels: time,
    datasets: [
      {
        label: "Dati Temperature",
        data: temperature,
        borderColor: "blue",
        pointBackgroundColor: [],
      },
      {
        label: "Media della giornata",
        data: avgTemp,
        borderColor: "orange",
        borderDash: [3, 3],
      },
    ],
  };

  chartTemp.datasets[0].pointBackgroundColor[maxIndexTemp] = "red";
  chartTemp.datasets[0].pointBackgroundColor[minIndexTemp] = "yellow";

  for (let i = 0; i < temperature.length; i++) {
    if (i !== maxIndexTemp && i !== minIndexTemp) {
      chartTemp.datasets[0].pointBackgroundColor[i] = "blue";
    }
  }

  let options1 = {
    responsive: true,
    width: 500,
    height: 400,
  };

  let temp = new Chart(ctxTemp, {
    type: "line",
    data: chartTemp,
    options: options1,
  });

  const ctxHum = document.getElementById("hum").getContext("2d");

  const maxIndexHum = humidity.indexOf(Math.max(...humidity));
  const minIndexHum = humidity.indexOf(Math.min(...humidity));

  let chartHum = {
    labels: time,
    datasets: [
      {
        label: "Dati Umidità",
        data: humidity,
        borderColor: "blue",
        pointBackgroundColor: [],
      },
      {
        label: "Media della giornata",
        data: avgHum,
        borderColor: "orange",
        borderDash: [3, 3],
      },
    ],
  };

  let options2 = {
    responsive: true,
    width: 500,
    height: 400,
  };

  chartHum.datasets[0].pointBackgroundColor[maxIndexHum] = "red";
  chartHum.datasets[0].pointBackgroundColor[minIndexHum] = "yellow";

  for (let i = 0; i < humidity.length; i++) {
    if (i !== maxIndexHum && i !== minIndexHum) {
      chartHum.datasets[0].pointBackgroundColor[i] = "blue";
    }
  }

  let hum = new Chart(ctxHum, {
    type: "line",
    data: chartHum,
    options: options2,
  });

  const ctxWind = document.getElementById("wind").getContext("2d");

  const maxIndexWind = windspeed.indexOf(Math.max(...windspeed));
  const minIndexWind = windspeed.indexOf(Math.min(...windspeed));

  let chartWind = {
    labels: time,
    datasets: [
      {
        label: "Dati Vento",
        data: windspeed,
        borderColor: "blue",
        pointBackgroundColor: [],
      },
      {
        label: "Media della giornata",
        data: avgWind,
        borderColor: "orange",
        borderDash: [3, 3],
      },
    ],
  };

  let options3 = {
    responsive: true,
    width: 500,
    height: 400,
  };

  chartWind.datasets[0].pointBackgroundColor[maxIndexWind] = "red";
  chartWind.datasets[0].pointBackgroundColor[minIndexWind] = "yellow";

  for (let i = 0; i < windspeed.length; i++) {
    if (i !== maxIndexWind && i !== minIndexWind) {
      chartWind.datasets[0].pointBackgroundColor[i] = "blue";
    }
  }

  let wind = new Chart(ctxWind, {
    type: "line",
    data: chartWind,
    options: options3,
  });

  const ctxMix = document.getElementById("mix").getContext("2d");

  let mixChart = {
    labels: time,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: temperature,
        yAxisID: "temperature-y-axis",
        borderColor: "blue",
      },
      {
        label: "Umidità (%)",
        data: humidity,
        yAxisID: "humidity-y-axis",
        borderColor: "green",
      },
      {
        label: "Vento (km/h)",
        data: windspeed,
        yAxisID: "windspeed-y-axis",
        borderColor: "orange",
      },
    ],
  };

  let options = {
    responsive: true,
    width: 1000,
    height: 400,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
      },
      "temperature-y-axis": {
        type: "linear",
        position: "left",
      },
      "humidity-y-axis": {
        type: "linear",
        position: "left",
        grid: {
          drawOnChartArea: false,
        },
      },
      "windspeed-y-axis": {
        type: "linear",
        position: "left",
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  let mix = new Chart(ctxMix, {
    type: "line",
    data: mixChart,
    options: options,
  });
}
