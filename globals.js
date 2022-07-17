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
    case "cin":
      reg = /^[a-zA-Z]{1,2}[0-9]{6}$/;
      break;
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
exports.web_protocol = "http"
exports.server_port = 3000
exports.domain = "localhost"
exports.render_url = function(page){
  return exports.web_protocol + "://" + exports.domain + ":" + String(exports.server_port) + "/" + page + "/"
}

/* CONVENIENCE */
// beautify dates
exports.pretty_datetime = function (datetime_str) {
  var datetime = new Date(datetime_str)
  var year = datetime.getFullYear(); 
  var month = datetime.getMonth();
  var day = datetime.getDate();
  var hour = datetime.getHours();
  var minute = datetime.getMinutes();
  return day + '/' + month + '/' + year + ' at ' + hour + ':' + minute;
}
