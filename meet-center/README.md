## Project structure

<ul>
  <li><b>./add_admin.js</b> : This is a script to properly add the first admin to the database so that he can add employees through the web app, it's helps add the admin without having to manually check if the data inserted into the database respects the constraints, it also encrypts the password for the inserted admin.</li>
  <li><b>./globals.js</b> : This file contains some functions that are used to do some tasks (encrypt passwords, format dates, check if the data you want to insert to the database is in the correct format...), and global variables (database settings...) please check it for better understanding.</li>
  <li><b>./node_modules</b> : It's exactly what it says, It shouldn't be manually modified.</li>
  <li><b>./package.json</b> and <b>./package-lock.json</b> : These contain project packaging information, they shouldn't be manually modified.</li>
  <li><b>./public</b> : This directory contains static files.</li>
  <li><b>./README.md</b> : This is just for github.</li>
  <li><b>./server.js</b> : This file contains the server configuration, peer-to-peer connection authentification and routes, it's the main backend file for the web app. </li>
  <li><b>./server.cert</b> and <b>./server.key</b> : These two are development ssl certificate and key, please change them to your own authentic ssl certificate and key in the production environment.</li>
  <li><b>./views</b> : This directory contains views made with the ejs templating language, <b>./views/partials</b> contains the header and footer that's common with all the views to avoid code repitition.</li>
</ul>

## Dependencies

<ul>
  <li>A stable, relatively new version of MySQL (or WAMP development stack for windows).</li>
  <li>Node.js and npm.</li>
  <li>Git <b>(optional)</b>.</li>
</ul>

## Deploying the server for the first time

<ol>
  <li>
    Start MySQL service.
  </li>
  <li>
    Open MySQL in the terminal or MySQL Workbench GUI, and execute <a href='https://github.com/techguyseli/meet-center/blob/main/database_creation_script.sql'>this SQL script</a> in MySQL, that will create the database, tables and user (<b>It's recommended to change the database user password to a stronger one)</b>.
  </li>
  <li>
    Open another terminal window and type this command by replacing <b>/my/path/</b> with the parent path you want to put the project in:


```bash
cd /my/path/ 
```

  </li>
  <li>
    Then in the same shell, execute this command to clone the project:

```bash
git clone https://github.com/techguyseli/meet-center 
```

    Or if git is not installed you can clone it manually by clicking <a href="https://github.com/techguyseli/meet-center/archive/refs/heads/main.zip">this link</a> and downloading the zip in the specified path and extracting it there.
  </li>
  <li>
    Run this command to move to the project folder:


```bash
cd ./meet-center/meet-center
```

  </li> 
  <li>
    Install the necessary modules using this npm command:

```bash
npm install
```

  </li>
  <li>
    Open the file ./globals.js from your current position, and modify the database settings to the same ones you executed in the sql script earlier (the username, database name, password...), also modify the server_url variable to store the correct server url that will be put in the forms and links.
  </li>
  <li>
    Run the add_admin.js script to add an admin to the database.
    
```bash
node add_admin.js
```

  </li>
  <li>
    Now you can run the server in the terminal.
    You can either use nodemon for automatic server restart after each file save (mainly used for the development environment):
    
```bash
npm run devStart
```

Or you can run the server.js file directly using node:

```bash
node server.js
```  
  </li>
</ol>

## Note

<ul>
  <li>
    If the dates are weirdly modified in the server consider modify the <b>pretty_datetime</b> function and/or the <b>get_tz_date</b> function in <b>./globals.js</b>.
  </li>
  <li>
    It's better when more than 2 participants join a meeting, to deactivate their audio and video unless when they're needed, in order to have optimal performance.
  </li>
</ul>
