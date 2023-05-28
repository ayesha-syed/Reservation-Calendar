const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');

const app = express();
const init_data_path = './init_data.json';

// Parse application/json
app.use(bodyParser.json());

let data = require(init_data_path).data;

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Wrapper to send data with max latency of 1 second
function send(response, data) {
  setTimeout(function () {
    response.send(JSON.stringify(data));
  }, Math.floor(Math.random() * 1000));
}

// End-point to get booked nights
// * start and end are integers (seconds since Unix epoch)
app.get('/reserve/:start/:end', function (request, response) {
  var start = parseInt(request.params.start);
  var end = parseInt(request.params.end);

  if (isNaN(start) || isNaN(end)) {
    response.status(400);
    response.send('Bad Request');
    return;
  }

  var reserved = _.filter(data, function (night) {
    var nightTime = night['time'];
    return nightTime >= start && nightTime <= end;
  });

  send(response, {
    reserved: reserved
  });
});

// Post reservation
app.post('/reserve', function (request, response) {
  var body = request.body;
  var date = body.time;

  if (isNaN(date)) {
    response.status(400);
    response.send('Date is NaN');
    return;
  }

  var reserved = body.reserved;
  var tenantName = body.tenantName;

  var tenantData = {
    'tenantName': tenantName,
    'time': date,
  };

  var isReserved = _.some(data, function (night) {
    var nightTime = night.time;
    return moment.unix(date).isSame(moment.unix(nightTime), 'day');
  });

  // If day is already reserved, send alert
  if (reserved && isReserved) {
    response.status(400);
    response.send('Slot already reserved');
    return;
  }

  if (!reserved && !isReserved) {
    response.status(400);
    response.send('Slot not found');
    return;
}

  if (reserved) {
    data.push(tenantData);
  } else {
    _.remove(data, function (night) {
      return night.time === date;
    });
  }

  // Update init_data.json
  var updatedData = {
    data: data
  };

  // Update init_data.json
  fs.writeFileSync('./init_data.json', JSON.stringify(updatedData));

  send(response, {
    success: true
  });
});


// Get server time
app.get('/now', function (request, response) {
  // Since UNIX timestamp would be the same for server and client browser,
  // returning the exact time of server. In this case fixed it to Dubai instead of local.
  send(response, {
    time: moment(new Date()).unix(),
    // friendlyTime: moment()
    //     .tz(locale)
    //     .format('YYYY-MM-DD HH:mm'),
    timeZone: locale
  });
});

// Endpoint to get init_data.json
app.get('/init-data', function (request, response) {
  fs.readFile(init_data_path, 'utf8', function (err, fileData) {
    if (err) {
      response.status(500);
      response.send('Internal Server Error');
      return;
    }

    const initData = JSON.parse(fileData);
    send(response, initData);
  });
});

// Endpoints to remove data from init_data.json
app.post('/remove-init-data', function (request, response) {
  const body = request.body;
  console.log(body.time);
  
  const updatedData = {
    data: data
  };

  fs.writeFileSync(init_data_path, JSON.stringify(updatedData));

  send(response, {
    success: true
  });
});

// Endpoint to update init_data.json
app.post('/update-init-data', function (request, response) {
  const body = request.body;
  const newData = body.data;

  if (!Array.isArray(newData)) {
    response.status(400);
    // response.send('Invalid data format');
    return;
  }

  data = newData;
  const updatedData = {
    data: data
  };


  fs.writeFileSync(init_data_path, JSON.stringify(updatedData));

  send(response, {
    success: true
  });
});

app.use(express.static(__dirname + '/lib'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/lib/index.html');
});

var port = 3000;
console.info('API server listening at http://localhost:' + port);
app.listen(port);
