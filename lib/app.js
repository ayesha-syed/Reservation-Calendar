
var app = angular.module('calendarApp', []);

app.controller('CalendarController', function($scope, $http) {
  var calendar = this;

  // Initialize current month
  var today = new Date();
  calendar.month = new Date(today.getFullYear(), today.getMonth(), 1);

  // console.log(`!!INFO: Today is ${today}`)

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
      // var date = new Date(today.getFullYear(), today.getMonth(), i);
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

        // Update init_data.json
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


  // Initialize the calendar
  calendar.init = function() {

  };

  calendar.init();
});
