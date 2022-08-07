## Project structure

./add_admin.js : This is a script to properly add the first admin to the database so that he can add employees through the web app, it's helps add the admin without having to manually check if the data inserted into the database respects the constraints, it also encrypts the password for the inserted admin.

./globals.js : This file contains some functions that are used to do some tasks (encrypt passwords, format dates, check if the data you want to insert to the database is in the correct format...), and global variables (database settings...) please check it for better understanding.

./node_modules : It's exactly what it says, It shouldn't be manually modified.

./package.json and /package-lock.json : These contain project packaging information, they shouldn't be manually modified.

./public : This directory contains static files.

./README.md : This is just for github.

./server.js : This file contains the server configuration, peer-to-peer connection authentification and routes, it's the main backend file for the web app. 

./server.cert and /server.key : These two are development ssl certificate and key, please change them to your own authentic ssl certificate and key in the production environment.

./views : This directory contains views made with the ejs templating language, /views/partials contains the header and footer that's common with all the views to avoid code repitition.

## Launching the server for the first time

1) Start MySql service and create the database, the tables (using ../database_creation_script.sql), the user and grant him the wanted privilages over the database (preferably all privilages).

2) Install the necessary modules using npm.

```bash
npm install
```

2) Open globals.js and modify the database settings variables, also modify the server_url variable to store the correct server url that will be put in the forms and links.

3) Run the add_admin.js script to add an admin to the database.

```bash
node add_admin.js
```

4) Now you can run the server in the terminal.
You can either use nodemon for automatic server restart after each file save (mainly used for the development environment):

```bash
npm run devStart
```

Or you can run the server.js file directly using node:

```bash
node server.js
```

## Note

If the dates are weirdly modified in the server consider modify the pretty_datetime function and/or the get_tz_date function in globals.js.
