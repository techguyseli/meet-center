/* IMPORTS */
const express = require('express') 
const app = express() 
const https = require('https');
const fs = require('fs'); // module for working with the file system
// https certificat and key files, please change them to official ones
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};
const server = https.createServer(options, app) 
const { Server } = require("socket.io");
const io = new Server(server);
const { ExpressPeerServer } = require('peer'); //WebRTC api for real time media communication
let mysql = require('mysql'); 
const globals = require('./globals') // importing my global variables and functions
const body_parser = require('body-parser') // importing a module to get sent data in a post request
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const uuid = require('uuid'); // module for generating random string IDs


/* CONFIGURING THE WEB APP */
const peerServer = ExpressPeerServer(server, {
    debug: true
});
app.set('view engine', 'ejs'); // setting the template engine to ejs 
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

// deleting done meetings from database
const intervalID = setInterval(deleteDoneMeetings, oneDay);
function deleteDoneMeetings () {
  console.log("Deleting done meetings...")
  const now = new Date()
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("delete from meet where end_datetime < ?", [ now ] , function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    console.log(results.affectedRows + " meetings deleted at " + globals.pretty_datetime(now.toString()) + ".")
  });
  con.end();
}


/* ROUTES */
/*
 * it's necessary to pass these to the render function because they're needed in /views/partials/header.ejs which is included in all the views:
 * sessions
 * urls
*/
// urls gathered for easy passing
let urls = {
  home : globals.server_url,
  login : globals.render_url('login'),
  logout : globals.render_url('logout'),
  account_settings : globals.render_url('account_settings'),
  change_password : globals.render_url('change_password'),
  invites : globals.render_url('invites'),
  my_meets : globals.render_url('my_meets'),
  create_meet : globals.render_url('create_meet'),
  delete_meet : globals.render_url('delete_meet'),
  modify_meet : globals.render_url('modify_meet'),
  remove_participant : globals.render_url('remove_participant'),
  add_participant : globals.render_url('add_participant'),
  view_employees : globals.render_url('view_employees'),
  add_employee : globals.render_url('add_employee'),
  modify_employee_get : globals.render_url('modify_employee_get'),
  modify_employee : globals.render_url('modify_employee'),
  remove_employee : globals.render_url('remove_employee'),
  room : globals.render_url('room'),
}

// default get route
app.get('/', (req, res) => {
  let session = req.session
  if(!session.email)
    return res.redirect("/login")
  return res.redirect('/invites')
})

// meetings' invites route
app.get('/invites', (req, res) => {
  let session = req.session
  // prevent unlogged users from visiting the page 
  if(!session.email)
    return res.redirect('/login')
  // get invites
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query('select code, title, description, announcement_datetime, start_datetime, end_datetime, first_name, last_name, email, phone, responsability from meet join participant on code = meet_code join employee on meet_owner = matr where emp_matr = ? and end_datetime > ?', [session.matr, now], function (error, results) {
    // check if there were any database errors while getting invites 
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
      for (let i = 0; i < results.length; i++){
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
  let session = req.session
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
  let session = req.session
  if (session.email)
    return res.redirect("/")
  // getting email and password
  let response = {
    email : String(req.body.email),
    password : String(req.body.password)
  };
  // creating a database connection
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("select matr, first_name as f_name, last_name as l_name, email, is_admin, password as pass, phone, responsability as resp from employee where email = ?", [response.email], function (error, results, fields) {
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
      let passOk = globals.compare_passwords(response.password, results[0].pass)
      if (results.length && passOk){
          // add user session
          session.matr = results[0].matr
          session.f_name = results[0].f_name
          session.l_name = results[0].l_name; 
          session.email = results[0].email
          session.pass = results[0].pass
          session.is_admin = results[0].is_admin
          session.phone = results[0].phone
          session.resp = results[0].resp
          res.redirect("/")
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
  let session = req.session
  if (session.email)
    session.destroy();
  return res.redirect('/login');
});

// account settings
app.get('/account_settings', (req, res) => {
  let session = req.session
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
  let session = req.session
  if (!session.email)
    return res.redirect('/login')
  // getting email and password
  let response = {
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
  if (!globals.compare_passwords(response.old_pass, session.pass))
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
  let pass_hash = globals.encrypt(response.new_pass)
  let con = mysql.createConnection({
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
      session.pass = pass_hash
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
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // get meets
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query('select code, title, description, announcement_datetime, start_datetime, end_datetime from meet where meet_owner = ? and end_datetime > ? order by start_datetime', [session.matr, now], function (error, results) {
    // check if there were any database errors 
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
      for (let i = 0; i < results.length; i++){
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

// create a new meet
app.get('/create_meet', (req, res) => {
  let session = req.session
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

// create a meet post
app.post('/create_meet', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // getting meet info
  let response = {
    title : String(req.body.title),
    desc : String(req.body.desc),
    start_d : new Date(String(req.body.start_d)),
    end_d : new Date(String(req.body.end_d))
  };
  // validating info
  let info_valid = globals.test_field(response.title, "titles") && globals.test_field(response.desc, "descriptions") && globals.test_dates(response.start_d, response.end_d) 
  if (!info_valid)
    return res.render('create_meet', {
      session : session,
      urls : urls,
      message : "The info is not in the correct form!"
    }) 
  // creating a database connection and inserting the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("insert into meet(code, title, description, start_datetime, end_datetime, announcement_datetime, meet_owner, owner_part_code) values(?, ?, ?, ?, ?, ?, ?, ?)", [ uuid.v4(), response.title, response.desc, response.start_d, response.end_d, now, session.matr, uuid.v4() ], function (error, results, fields) {
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
     res.render('create_meet', {
       session : session,
       urls : urls,
       message : "Meet created, go to my meet's page to modify the meet and add participants."
     })  
    }
  });
  con.end();
})

// delete a meet
app.get('/delete_meet/:meet_code', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // deleting the meet with the provided code THAT BELONGS TO THE USER
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("delete from meet where code = ? and meet_owner = ? and start_datetime > ?", [ String(req.params.meet_code), session.matr, now ], function (error, results, fields) {
    if(error || results.affectedRows == 0)
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else
      res.redirect('/my_meets')
  });
  con.end();
})

// getting a meet's mod page
app.get('/modify_meet/:meet_code', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // getting the meet's info and participants
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("select code, title, description, start_datetime, end_datetime, email, matr from meet left join participant on code = meet_code left join employee on emp_matr = matr where code = ? and meet_owner = ? and end_datetime > ?", [ String(req.params.meet_code), session.matr, now ], function (error, results, fields) {
    if(error || results.length == 0)
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else
      res.render('modify_meet', {
        session : session,
        urls : urls,
        results : results,
        message : null,
        now : new Date()
      })
  });
  con.end();

});

// modifying a meet
app.post('/modify_meet', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // getting meet info
  let response = {
    code : String(req.body.code),
    title : String(req.body.title),
    desc : String(req.body.desc),
    start_d : globals.get_tz_date(String(req.body.start_d)),
    end_d : globals.get_tz_date(String(req.body.end_d))
  };
  // validating info
  let info_valid = globals.test_field(response.code, 'code') && globals.test_field(response.title, "titles") && globals.test_field(response.desc, "descriptions") && globals.test_dates(response.start_d, response.end_d) 

  if (!info_valid)
    return res.render('modify_meet', {
      session : session,
      urls : urls,
      message : "The info is not in the correct form!"
    }) 
  // creating a database connection and updating the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("update meet set title = ?, description = ?, start_datetime = ?, end_datetime = ? where code = ? and start_datetime > ? and meet_owner = ?", [ response.title, response.desc, response.start_d, response.end_d, response.code, now, session.matr ], function (error, results, fields) {
    if(error || results.affectedRows == 0){
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
     res.redirect('/modify_meet/' + response.code)    
    }
  });
  con.end();
});

// removing a participant from a meet's participant list
app.post('/remove_participant', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  let response = {
    emp_matr : String(req.body.emp_matr),
    meet_code : String(req.body.meet_code)
  };
  // deleting the participant
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("delete from participant where emp_matr in(select emp_matr from participant join meet on code = meet_code where meet_owner = ? and code = ? and end_datetime > ? and emp_matr = ?)", [ session.matr, response.meet_code, now, response.emp_matr ], function (error, results, fields) {
    if(error || results.affectedRows == 0)
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else
      res.redirect('/modify_meet/' + response.meet_code)
  });
  con.end();
})

// add a participant to a meet
app.post('/add_participant', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // getting necessary info
  let response = {
    meet_code : String(req.body.meet_code),
    email : String(req.body.email)
  };
  // creating a database connection and inserting the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  let now = new Date()
  con.connect()
  con.query("insert into participant(part_code, emp_matr, meet_code) select ? as part_code, matr, ? as code from employee where email = ? and exists(select code from meet where meet_owner = ? and code = ?) and email != ? and (select count(part_code) from participant where meet_code = ?) < 20", [ uuid.v4(), response.meet_code, response.email, session.matr, response.meet_code, session.email, response.meet_code ], function (error, results, fields) {
    if(error){
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, maybe the employee is already invited to this meet, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    }
    else if (results.affectedRows == 0){
      res.render('error', {
        code: 'Oops',
        title: "Invalid Email",
        message: "The email you tried to add either doesn't exist, or it's your personal email that can't be added because you already own the meeting.",
        urls : urls,
        session: session
      });
    }
    else{
      res.redirect('/modify_meet/' + response.meet_code)
    }
  });
  con.end();
})

// admin get employees details
app.get('/view_employees', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("select matr, first_name, last_name, email, is_admin, phone, responsability as resp from employee where matr != ?", [session.matr], function (error, results, fields) {
    if(error)
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else
      res.render('view_employees', {
        results : results,
        urls : urls,
        session: session
      });
  });
  con.end();
})

// admin remove employee
app.post('/remove_employee', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  if (! session.is_admin)
    return res.render('error', {
      code: 404,
      title: "Page Not Found",
      message: "The page you requested doesn't exist.",
      urls : urls,
      session: session
    });
  // getting matr
  let response = {
    matr : String(req.body.matr)
  };
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("delete from employee where matr = ? and email != ?", [ response.matr, session.email ], function (error, results, fields) {
    if(error)
      // managing database errors
      res.render('error', {
        code: 500,
        title: "Internal Server Error",
        message: "Something went wrong, please try again later or contact the admins.",
        urls : urls,
        session: session
      });
    else
      res.redirect('/view_employees')
  });
  con.end();
})

// admin add employee get
app.get('/add_employee', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  if (! session.is_admin)
    return res.render('error', {
      code: 404,
      title: "Page Not Found",
      message: "The page you requested doesn't exist.",
      urls : urls,
      session: session
    });
  return res.render('add_employee', {
    urls : urls,
    session : session,
    message : ""
  })
})

// admin add an employee post
app.post('/add_employee', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  if (! session.is_admin)
    return res.render('error', {
      code: 404,
      title: "Page Not Found",
      message: "The page you requested doesn't exist.",
      urls : urls,
      session: session
    });
  // getting form info
  let response = {
    f_name : String(req.body.f_name),
    l_name : String(req.body.l_name),
    email : String(req.body.email).toLowerCase(),
    pass : String(req.body.pass),
    is_admin : String(req.body.is_admin),
    phone : String(req.body.phone),
    resp : String(req.body.resp)
  };
  // testing if the provided info is valid
  let info_valid = globals.test_field(response.f_name, "name") && globals.test_field(response.l_name, "name") && globals.test_field(response.email, "email") && globals.test_field(response.pass, "password_cleartext") && globals.test_field(response.phone, "phone") && globals.test_field(response.resp, "titles")
  if (response.is_admin == 'true') response.is_admin = true
  else response.is_admin = false
  if (!info_valid)
    return res.render('add_employee', {
      session : session,
      urls : urls,
      message : "The info is not in the correct form!"
    }) 
  // creating a database connection and inserting the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("insert into employee select ? as matr, ? as f_name, ? as l_name, ? as email, ? as pass, ? as admin, ? as phone, ? as resp where ? not in(select email from employee)", [ uuid.v4(), response.f_name, response.l_name, response.email, globals.encrypt(response.pass), response.is_admin, response.phone, response.resp, response.email], function (error, results, fields) {
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
    else if (results.affectedRows == 0){
      res.render('error', {
        code: 'Oops',
        title: "Unique Values Repeated",
        message: "The email and/or phone number you provided may already exist in the database.",
        urls : urls,
        session: session
      });
    }
    else{
      res.render('add_employee', {
        message: "Employee added successfully.",
        urls : urls,
        session: session
      });
    }
  });
  con.end();
})

// admin "get" the employee details for modifying
app.post('/modify_employee_get', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  if (! session.is_admin)
    return res.render('error', {
      code: 404,
      title: "Page Not Found",
      message: "The page you requested doesn't exist.",
      urls : urls,
      session: session
    });
  let response = {
    matr : String(req.body.matr)
  }
  // creating a database connection and inserting the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("select matr, first_name as f_name, last_name as l_name, email, is_admin, phone, responsability as resp from employee where matr = ?", [ response.matr ], function (error, results, fields) {
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
    else if (results.length == 0){
      res.render('error', {
        code: 'Oops',
        title: "No Results Available",
        message: "Couldn't find the employee you were looking for.",
        urls : urls,
        session: session
      });
    }
    else{
      res.render('modify_employee', {
        message: "",
        results : results[0],
        urls : urls,
        session: session
      });
    }
  });
  con.end();
})

// admin modify an employee
app.post('/modify_employee', (req, res) => {
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  if (! session.is_admin)
    return res.render('error', {
      code: 404,
      title: "Page Not Found",
      message: "The page you requested doesn't exist.",
      urls : urls,
      session: session
    });
  // getting necessary info
  let response = {
    matr : String(req.body.matr),
    f_name : String(req.body.f_name),
    l_name : String(req.body.l_name),
    email : String(req.body.email).toLowerCase(),
    pass : String(req.body.pass),
    reset_pass : String(req.body.reset_pass),
    is_admin : String(req.body.is_admin),
    phone : String(req.body.phone),
    resp : String(req.body.resp)
  };
  // testing if the provided info is valid
  let info_valid = globals.test_field(response.f_name, "name") && globals.test_field(response.l_name, "name") && globals.test_field(response.email, "email") && globals.test_field(response.pass, "password_cleartext") && globals.test_field(response.phone, "phone") && globals.test_field(response.resp, "titles")
  if (response.is_admin == 'true') response.is_admin = true
  else response.is_admin = false
  if (!info_valid)
    return res.render('error', {
      code: 'Oops',
      title: "Invalid Information",
      message: "The info you provided is invalid.",
      urls : urls,
      session: session
    })
  let sql, args;
  if (response.reset_pass != 'undefined'){
    sql = 'update employee set first_name = ?, last_name = ?, email = ?, password = ?, is_admin = ?, phone = ?, responsability = ? where matr = ?'
    args = [ response.f_name, response.l_name, response.email, globals.encrypt(response.pass), response.is_admin, response.phone, response.resp, response.matr ]
  }
  else {
    sql = 'update employee set first_name = ?, last_name = ?, email = ?, is_admin = ?, phone = ?, responsability = ? where matr = ?'
    args = [ response.f_name, response.l_name, response.email, response.is_admin, response.phone, response.resp, response.matr ]
  }
  // creating a database connection and inserting the data
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query(sql, args, function (error, results, fields) {
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
    else if (results.affectedRows == 0){
      res.render('error', {
        code: 'Oops',
        title: "Nothing Changed",
        message: "The employee wasn't modified, maybe you entered a duplicate email, please try again later.",
        urls : urls,
        session: session
      });
    }
    else{
      res.render('modify_employee', {
        message: "Employee modified successfully.",
        results : response,
        urls : urls,
        session: session
      });
    }
  });
  con.end();
})

// join a meet room, first check if the user is connected and invited to send him his secret participant code
app.get('/room/:code', function (req, res) {
  const code = String(req.params.code)
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  // getting user participant code (if invited) 
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("select part_code, false as is_owner from participant where meet_code = ? and emp_matr = ? union select owner_part_code, true from meet where code = ? and meet_owner = ?", [ code, session.matr, code, session.matr], function (error, results, fields) {
    if(error || results.length == 0){
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
      return res.render('room', {
        this_room_id : code,
        this_user_id : session.matr,
        part_code : results[0].part_code,
        is_owner : results[0].is_owner,
        urls : urls,
        session : session
      })   
    }
  });
  con.end();
})

// function to remove a participant by matr and meet code
function manualPartRemove (matr, roomId) {
  let con = mysql.createConnection({
    host: globals.host,
    user: globals.user,
    password: globals.password,
    database: globals.database
  });
  con.connect()
  con.query("delete from participant where emp_matr = ? and meet_code = ?", [ matr, roomId ], function (error, results, fields) {
    if (error) {
      console.log(error);
    }
  });
  con.end();
}

// managing socket connections for meets
io.on('connection', socket => {
  socket.on('join-room', function (data) {
    // authenticating the user
    let sql = "select part_code from participant where emp_matr = ? and meet_code = ? and part_code = ?"
    if (data.is_owner) sql = "select owner_part_code from meet where meet_owner = ? and code = ? and owner_part_code = ?"
    let args = [ data.userId, data.roomId, data.part_code ]
    let con = mysql.createConnection({
      host: globals.host,
      user: globals.user,
      password: globals.password,
      database: globals.database
    });
    con.connect()
    con.query(sql, args, async function (error, results, fields) {
      // if there is an attempt at hacking or malliciously using this service by anauthorized people then cancel the connection
      if (error || results.length == 0) {
        console.log(error);
        socket.emit("msg", "An error occured, please contact the host or an admin for more info.")
        return;
      }

      socket.data.id = data.userId
      socket.data.name = data.name
      socket.data.is_owner = data.is_owner 
      const roomSockets = await io.in(data.roomId).fetchSockets()
      
      // join host before everyone for good functioning
      if (roomSockets.length == 0 && !socket.data.is_owner) {
        socket.emit("msg", "The host hasn't joined yet please contact him so that he joins first, then you can join.")
        return
      }

      const participants = []
      for (let i = 0; i < roomSockets.length; i++) {
        participants.push({
          userId : roomSockets[i].data.id,
          name : roomSockets[i].data.name
        })
      }
      socket.emit("get-parts-list", participants)

      socket.join(data.roomId)

      socket.broadcast.to(data.roomId).emit('user-connected', data.userId, data.name)

      socket.on('disconnect', () => {
        socket.broadcast.to(data.roomId).emit('user-disconnected', data.userId)
      })

      socket.on('manual-disconnect', () => {
        socket.broadcast.to(data.roomId).emit('user-disconnected', data.userId)
      })

      socket.on('kick', function (userId) {
        if (socket.data.is_owner) {
          manualPartRemove(userId, data.roomId)
          socket.broadcast.to(data.roomId).emit('user-kicked', userId) 
          socket.broadcast.to(data.roomId).emit('got-kicked', userId) 
        }
      })
    });
    con.end();
  })
})

// default route for all http methods
app.use(function(req, res){
  let session = req.session
  if (!session.email)
    return res.render('login', {
      urls : urls,
      message: "",
      session: session
    });
  return res.render('error', {
    code: 404,
    title: "Page Not Found",
    message: "The page you requested doesn't exist.",
    urls : urls,
    session: session
  });
});
  
// Creating https server by passing
server.listen(3000, function (req, res) {
  console.log("Server started at " + urls.home);
});
