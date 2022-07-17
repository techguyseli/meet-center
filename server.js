/* IMPORTS */
const express = require('express') // importing the web dev module 'express'
const app = express() // setting this project to be an express app
const server = require('http').Server(app) // importing http server
var mysql = require('mysql'); // mysql interface
const globals = require('./globals') // importing global variables and functions
const body_parser = require('body-parser') // importing a module to get sent data in a post request
const cookieParser = require("cookie-parser"); // module for managing cookies
const sessions = require('express-session'); // module for managing sessions
const uuid = require('uuid'); // module for generating random strings
//const io = require('socket.io')(server) // importing a socket connection framework


/* CONFIGURING THE WEB APP */
app.set('view engine', 'ejs'); // setting the view engine to ejs 
app.use(express.static('public')); // setting the static files folder
// configure body-parser for express
app.use(body_parser.urlencoded({extended:false}));
app.use(body_parser.json());
// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// configuring session options
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: uuid.v4() + uuid.v4(),
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));
app.use(cookieParser());


/* ROUTES */
/*
 * it's necessary to pass these to the render function because they're needed in the partials:
 * sessions
 * urls
*/
// urls gathered for easy passing
var urls = {
  login : globals.render_url('login'),
  logout : globals.render_url('logout'),
  account_settings : globals.render_url('account_settings'),
  change_password : globals.render_url('change_password'),
  invites : globals.render_url('invites'),
  my_meets : globals.render_url('my_meets'),
  create_meet : globals.render_url('create_meet'),
}
// default get route
app.get('/', (req, res) => {
  return res.redirect('/invites')
})

// meetings' invites route
app.get('/invites', (req, res) => {
  var session = req.session
  // take visitors to login 
  if(!session.email)
    return res.redirect('/login')
  // get invites
  var con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query('select title, description, announcement_datetime, start_datetime, end_datetime, first_name, last_name, email, phone, responsability from meet join participant on code = meet_code join employee on meet_owner = cin where meet_owner = ? or emp_cin = ?', [session.cin, session.cin], function (error, results) {
    // check if there were any database errors while updating the password 
    if (error)
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else {
      // making the dates pretty
      for (var i = 0; i < results.length; i++){
        results[i].announcement_datetime = globals.pretty_datetime(results[i].announcement_datetime.toString())
        results[i].start_datetime = globals.pretty_datetime(results[i].start_datetime.toString())
        results[i].end_datetime = globals.pretty_datetime(results[i].end_datetime.toString())
      }
      res.render('invites', {
        results : results, 
        urls : urls,
        session : session
      });
    }
  });
  con.end();
});

// login get route
app.get('/login', (req, res) => {
  var session = req.session
  // redirect visitors to login
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // redirect connected users to invites 
  return res.redirect('/invites')
});

// login post route
app.post('/login', (req, res) => {
  var session = req.session
  if (session.email)
    return res.redirect("/")
  // getting email and password
  var response = {
    email : String(req.body.email),
    password : String(req.body.password)
  };
  // creating a database connection
  var con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("select cin, email, password from employee where email = ?", [response.email], function (error, results, fields) {
    if(error){
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    }
    else{
      // checking if account exists
      if (results.length){
        if (globals.compare_passwords(response.password, results[0].password)) {
          // add user session
          session.cin = results[0].cin
          session.email=response.email; 
          session.password = globals.encrypt(response.password)
          res.redirect("/")
        }
        else{
          res.render('login', {
            urls : urls,
            message: "The email and/or password were incorrect, please try again.",
            session: session
          });
        }
      }else{
        res.render('login', {
          urls : urls,
          message: "The email and/or password were incorrect, please try again.",
          session: session
        });
      }
    }
  });
  // closing database connection to minimize load
  con.end();
});

// logout
app.get('/logout', (req, res) => {
  var session = req.session
  if (session.email)
    session.destroy();
  return res.redirect('/login');
});

// account settings
app.get('/account_settings', (req, res) => {
  var session = req.session
  if (!session.email)
    return res.redirect('/login');
  return res.render('account_settings', {
    urls : urls,
    message: "",
    session: session
  })
});

// change password post
app.post('/change_password', (req, res) => {
  var session = req.session
  if (!session.email)
    return res.redirect('/login')
  // getting email and password
  var response = {
    old_pass : String(req.body.old_password),
    new_pass : String(req.body.new_password),
    pass_repeat : String(req.body.password_repeat)
  };
  // checking passwords format
  if (!(globals.test_field(response.old_pass, "password_cleartext") && globals.test_field(response.new_pass, "password_cleartext") && globals.test_field(response.pass_repeat, "password_cleartext")))
    return res.render('account_settings', {
      urls : urls,
      message: "The passwords you submitted weren't all in the right format (between 8 and 40 characters).",
      session: session
    })
  // checking if original password is correct
  if (!globals.compare_passwords(response.old_pass, session.password))
    return res.render('account_settings', {
      urls : urls,
      message: "The current password is incorrect.",
      session: session
    })
  // checking if password didn't change
  if (response.old_pass == response.new_pass)
    return res.render('account_settings', {
      urls : urls,
      message: "The current password and the new password are the same, so nothing changed.",
      session: session
    })
  // checking if password and confirmation match
  if (response.pass_repeat != response.new_pass)
    return res.render('account_settings', {
      urls : urls,
      message: "The new password and the its confirmation are not the same.",
      session: session
    })
  // update the password
  var pass_hash = globals.encrypt(response.new_pass)
  var con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("update employee set password = ? where email = ?", [pass_hash, session.email], function (error, results) {
    // check if there were any database errors while updating the password 
    if (error || results.changedRows == 0)
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else {
      session.password = pass_hash
      res.render('account_settings', {
        message: "Password changed successfully.",
        urls : urls,
        session: session
      });
    }
  });
  con.end();
});

// my meetings page
app.get('/my_meets', (req, res) => {
  var session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // get invites
  var con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  var now = new Date()
  con.connect()
  con.query('select code, title, description, announcement_datetime, start_datetime, end_datetime from meet where meet_owner = ? and end_datetime > ? order by start_datetime', [session.cin, now], function (error, results) {
    // check if there were any database errors while updating the password 
    if (error)
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else {
      // making the dates pretty
      for (var i = 0; i < results.length; i++){
        results[i].announcement_datetime = globals.pretty_datetime(results[i].announcement_datetime.toString())
        results[i].start_datetime = globals.pretty_datetime(results[i].start_datetime.toString())
        results[i].end_datetime = globals.pretty_datetime(results[i].end_datetime.toString())
      }
      res.render('my_meets', {
        results : results, 
        urls : urls,
        session : session
      });
    }
  });
  con.end();
});

// create a new meet Page
app.get('/create_meet', (req, res) => {
  var session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  return res.render('create_meet', {
    urls : urls,
    message : "",
    session : session
  })
})

// create a meet

// default route for all http methods
app.use(function(req, res){
  return res.render('error', {
    code: 404,
    title: "Page Not Found",
    message: "The page you requested doesn't exist.",
    urls : urls,
    session: req.session
  });
});


server.listen(3000) // opening a web server on port 3000
