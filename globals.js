/* 
 * this file is made to store global variables and functions that are used in various places of the project for easy changing
*/

/* IMPORTS */
const bcrypt = require('bcryptjs'); // encryprion module

/* DATABASE SETTINGS */
exports.host = "localhost";
exports.user = "reunion_center_user";
exports.password = "password1";
exports.database = "reunion_center";

/* TESTS */
// database field value tests
exports.test_field = function (value, field) {
  var reg;
  switch(field){
    case "name":
      reg = /^[a-zA-Z]{1,20}$/;
      break;
    case "email":
      reg = /^.{1,25}@alamana\.org\.ma$/;
      break;
    case "password_cleartext":
      reg = /^.{8,40}$/;
      break;
    case "titles":
      reg = /^.{1,50}$/;
      break;
    case "descriptions":
      reg = /^.{0,300}$/;
      break;
    case "phone":
      reg = /^[0-9]{10}$/;
      break;
    case "code":
      reg = /^.{10,50}$/;
      break;

    default:
      return false;
  }
  return reg.test(value); 
}
// test start and end date and today
exports.test_dates = function (start_d, end_d){
  var now = new Date()
  return (start_d - end_d < 0 && start_d > now)
}

/* ENCRYPTION */
const salt_length = 10;
// encrypt a password and return the hash 
exports.encrypt = function (password) {
  var hash = bcrypt.hashSync(password, salt_length);
  return hash;
};
// compare a clear text password and a hash and return true if idebtical
exports.compare_passwords = function (password, hash) {
  var passwords_identical = bcrypt.compareSync(password, hash);
  return passwords_identical;
};

/* SERVER AND URLS */
exports.render_url = function(page){
  return "http://localhost:3000/" + page + "/"
}

/* CONVENIENCE */
// beautify dates
exports.pretty_datetime = function (datetime_str) {
  var datetime = new Date(datetime_str)
  var year = datetime.getFullYear(); 
  var month = datetime.getMonth() + 1;
  if (month < 10) month = '0' + String(month)
  var day = datetime.getDate();
  if (day < 10) day = '0' + String(day)
  var hour = datetime.getHours();
  if (hour < 10) hour = '0' + String(hour)
  var minute = datetime.getMinutes();
  if (minute < 10) minute = '0' + String(minute)
  return day + '/' + month + '/' + year + ' at ' + hour + ':' + minute;
}
// return a properly timezoned date
exports.get_tz_date = function (datetime_str){
  var datetime = new Date(datetime_str)
  var year = datetime.getFullYear(); 
  var month = datetime.getMonth();
  var day = datetime.getDate();
  var hour = datetime.getHours() + 1;
  var minute = datetime.getMinutes();
  var new_datetime = new Date(year, month, day, hour, minute, 0)
  return new_datetime
}
