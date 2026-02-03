# Mauricio Share
# DO NOT USE THIS IN PRODUCTION

A small application for uploading files in a home network.
it's made to be a easy way to both send and download files inside a home network,
not safe at all to be used over the internet.

## Setup
Make sure to install and use the node version from `.nvmrc` file.

run npm install on the frontend and the backend.

```sh
$ (cd frontend; npm install)
$ (cd backend; npm install)
```

## Usage
It's recommended to use foreman to run, but it's not required.

With foreman, on the same folder as the Procfile.
```sh
$ UPLOAD_PATH=~/FolderToShare foreman start
```

Without foreman:
```sh
$ UPLOAD_PATH=~/FilderToShare (cd ./backend; node index.ts) &
$ (cd ./frontend; npm run dev) &
```


## Configuration

Those are all the evironment variables that can be set

```sh
# defaults to 3290
BACKEND_PORT=3290 

# Sends desktop notifications
# Options are 
# TRUE it will send notifications using node-notify
# POPOS my personal hack to send desktop notifications on PopOS
# Leave empty or don't set to not send desktop notifications
NOTIFY= 

# The name that will be shown in the notifications on the back end
APP_NAME='Share Server'

# Path to the folder where the files will be uploaded to
# the app won't launch if this isn't set up properly
UPLOAD_PATH=~/SharedFiles

# Name that will be displayed on the front end title
VITE_APP_NAME='Name of the App'

# Address to the backend server to upload files
# and get the images
VITE_FILESERVER_ADDRESS=http://localhost:3290

```
