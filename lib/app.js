var app = angular.module('calendarApp', []);

app.controller('CalendarController', function($scope, $http) {
  var calendar = this;

  // Initialize current month
  var today = new Date();
  calendar.month = new Date(today.getFullYear(), today.getMonth(), 1);

  // Previous month
  calendar.previousMonth = function() {
    calendar.month.setMonth(calendar.month.getMonth() - 1);
    calendar.generateWeeks();
  };

  // Next month
  calendar.nextMonth = function() {
    calendar.month.setMonth(calendar.month.getMonth() + 1);
    calendar.generateWeeks();
  };

  calendar.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',];

  calendar.weeks = [];

  // Function to generate the weeks array
  calendar.generateWeeks = function() {
    var start = new Date(calendar.month.getFullYear(), calendar.month.getMonth(), 1);
    var end = new Date(calendar.month.getFullYear(), calendar.month.getMonth() + 1, 0);
    var numDays = end.getDate(); // Number of days in the current month
    var weeks = [];
    var week = [];

    // Iterate over the days of the month
    for (var i = 1; i <= numDays; i++) {
      const year = calendar.month.getFullYear()
      const month = calendar.month.getMonth()
      const din = i

      var date = new Date(year, month, din);

      if (i === 1) {
        for (var j = 0; j < date.getDay(); j++) {
          week.push({
            date: null,
            reserved: null,
            tenantName: null
          });
        }
      }

      var day = {
        date: date,
        reserved: false,
        tenantName: ''
      };

      const dateTime = date.getTime()
      var isReserved = calendar.reservedNights.find((night) => night.time === dateTime)

      if (isReserved) {
        day.reserved = true;
        day.tenantName = isReserved.tenantName;
      }

      // Push the day to the week array
      week.push(day);

      // If it's the last day of the week or the last day of the month
      // Push the week to the weeks array and start a new week
      if (date.getDay() === 6 || i === numDays) {
        weeks.push(week);

        week = [];
      }
    }

    // Set the generated weeks array to the calendar.weeks
    calendar.weeks = weeks;
  };

  
// Update init_data.json
calendar.updateInitData = function(newData) {
  $http.get('/init-data')
    .then(function(response) {
      var initData = response.data;

      return $http.post('/update-init-data', initData);
    })
    .then(function(response) {
      console.log('init_data.json updated:', response.data);
    })
    .catch(function(error) {
      console.error('Error updating init_data.json:', error);
    });
};

  // Check if a day is reserved
  calendar.isDayReserved = function(date) {
    var reservedDay = null;
    angular.forEach(calendar.reservedNights, function(night) {
      var nightDate = new Date(night.time);

      if (nightDate === date) {
        reservedDay = night;
      }
    });
    return reservedDay;
  };

  // Get reserved nights from the server
  calendar.getReservedNights = function() {
    var start = (new Date().getTime());
    var end = (new Date().getTime()) + 86400 * 365; // 1 year

    $http.get('/reserve/' + start + '/' + end)
      .then(function(response) {
        calendar.reservedNights = response.data.reserved;
        calendar.generateWeeks();
      })
      .catch(function(error) {
        console.error('Error getting reserved nights:', error);
      });
  };

  // Show the tenant modal
  calendar.showTenantModal = function(day) {
    calendar.selectedDay = day;
    calendar.tenantName = day.tenantName;
    calendar.showModal = true;
  };

  // Save the tenant
  calendar.saveTenant = function() {
    calendar.selectedDay.tenantName = calendar.tenantName;

    var data = {
      time: (calendar.selectedDay.date.getTime()),
      reserved: true,
      tenantName: calendar.tenantName
    };

    $http.post('/reserve', data)
      .then(function(response) {
        console.log('Tenant saved:', response.data);

        var newData = {
          tenantName: calendar.tenantName,
          time: (calendar.selectedDay.date.getTime())
        };
        calendar.updateInitData(newData);

        calendar.showModal = false;
      })
      .catch(function(error) {
        console.error('Error saving tenant:', error);
      });
  };

// Delete the tenant
calendar.deleteTenant = function(day) {
  if (!day.tenantName) {
    return;
  }

  var data = {
    time: (day.date.getTime()),
    reserved: false,
    tenantName: ''
  };

  $http.post('/reserve', data)
    .then(function(response) {
      console.log('Tenant deleted:', response.data);

      // Remove from init_data.json
      calendar.removeInitData(data.time);

      day.tenantName = '';
      day.reserved = false;
      calendar.showModal = false;
    })
    .catch(function(error) {
      console.error('Error deleting tenant:', error);
    });
};

// Remove from init_data.json
calendar.removeInitData = function(dateTime) {
  $http.get('/init-data')
    .then(function(response) {
      var initData = response.data;
      initData.data = initData.data.filter((night) => night.time !== dateTime)

      return $http.post('/update-init-data', initData);
    })
    .then(function(response) {
      console.log('Tenant removed from init_data.json:', response.data);
    })
    .catch(function(error) {
      console.error('Error removing tenant from init_data.json:', error);
    });
};

// Load data from init_data.json
calendar.loadData = function() {
  $http.get('/init-data')
    .then(function(response) {
      var initData = response.data;
      console.log('Data from init_data.json:', initData.data);

      // Add initData to calendar
      calendar.reservedNights = initData.data;
      console.log('final reserved nights:', calendar.reservedNights);

      calendar.generateWeeks();
    })
    .catch(function(error) {
      console.error('Error loading data from init_data.json:', error);
    });
};

  // Initialize the calendar
  calendar.init = function() {
  calendar.getReservedNights();
    calendar.loadData();
  };

  calendar.init();
});
