/*
 * this script is strictly for developpers, it's made to safely add the first admin to the app, after that that admin can add other admins from the apps website without having to use this script
*/

/* IMPORTS */
var mysql = require('mysql'); // mysql interface
const readline = require('readline-sync'); // module to read user input
var globals = require('./globals'); // module to import global variables and functions

/* WELCOME MESSAGE */
console.log("You are now going to add an admin to the meeting center app.");

/* GETTING USER INPUT */
// variables
var cin, first_name, last_name, email, password, phone, resp;
do{
  // fields specs
  console.log("Please fill everything as follows:\n");
  console.log("cin: 5 or 2 letters followed by 6 numbers.");
  console.log("first and last name: between 5 and 20 letters each.");
  console.log("email: has to be in this domain @alamana.org.ma.");
  console.log("password: needs to be between 12 and 40 characters.\n");
  // input gathering and testing
  cin = readline.question("CIN: ");
  if(!globals.test_field(cin, "cin")){
    console.log("the cin is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  first_name = readline.question("First Name: ");
  if(!globals.test_field(first_name, "name")){
    console.log("the first name is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  last_name = readline.question("Last Name: ");
  if(!globals.test_field(last_name, "name")){
    console.log("the last name is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  email = readline.question("Email: ");
  if(!globals.test_field(email, "email")){
    console.log("the email is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  phone = readline.question("Phone number: ");
  if(!globals.test_field(phone, "phone")){
    console.log("the phone number is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  resp = readline.question("Responsability: ");
  if(!globals.test_field(resp, "titles")){
    console.log("the responsability is not in the desired form, please read the fields specifications.\n");
    continue;
  }

  password = readline.question("Password: ");
  if(!globals.test_field(password, "password_cleartext")){
    console.log("the password is not in the desired form, please read the fields specifications.\n");
    continue;
  }
  var answer = readline.question("confirm ? (yes|no): ");
  if(answer=="yes")
    break;
  console.log("exiting");
  process.exit(4);
}
while (true);

/* ENCRYPTING THE PASSWORD */
var password_hash = globals.encrypt(password);

/* CREATING A DATABASE CONNECTION */
var con = mysql.createConnection({
  host: globals.host,
  user: globals.user,
  password: globals.password,
  database: globals.database
});

/* CONNECTING AND INSERTING THE ADMIN INTO THE DATABASE */
con.connect(function(err) {
  if (err) throw err;
    console.log("\n+ connected to the database.");
  var sql = "insert into employee values ?";
  var values = [
    [ cin, first_name, last_name, email, password_hash, true, phone, resp ]
  ];
  con.query(sql, [values], function (err, result) {
    if (err) throw err;
    console.log("+ Number of records inserted " + result.affectedRows);
    console.log("\nexiting");
    process.exit(0);
  });
});

