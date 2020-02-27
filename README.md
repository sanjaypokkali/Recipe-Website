# CodeMonk

# How to run the project #

The recipe website was written using Node.js, MongoDB, Express.js and EJS

To download all the dependancies for the backend, type "npm i" in the command line

Once all the dependancies have been downloaded run MongoDB by typing "mongod" in the terminal

To run the server type the command "node app.js". The website will be hosted on the url "http://localhost:3000"

Create a user and login to the website

The user can add/edit his or her own recipes, search based on ingredients and view other user recipes which they have uploaded.

# Assumptions #

Only one assumption was made. It is that when a user wants to have multiple recipes or steps, he/she has to provide each one in a new line. Bullet points and numbers will be added automatically

# Extra Information #

The user's password is encrypted so it is safe from attackers.

The images that the user uploads are saved locally for this instance (not in mongodb) but for future iterations can hosted on platforms such as cloudinary for faster performance
