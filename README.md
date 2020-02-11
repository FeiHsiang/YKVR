# Mifly develop webVR 0.1.5

Author: thonsha, known as one of the Elite Four (there are still three 
vacancies) under the king Mojo Jojo in Mifly design.

![Alt text](https://s3-ap-northeast-1.amazonaws.com/howtest.bk/temp/images/Mojo_with_EliteFour.png "Mojo Jojo with Elite Four")

---

## Introduction

This is a develop version of webVR based on MAKAR editor.

If you wnat to edit the project, please click [here](https://www.makerar.com/) to MAKAR website.

Click [here]() to the demo webVR website. Enter the username and select one of the projects, then start your own webVR experience.

---

## Launch webVR server

```
$ git clone https://thonsha@bitbucket.org/fefe78523/makarvr.git
$ cd  /mifly-webar-nft
$ git checkout developVR 
$ http-server -S -C .\conf\cert.pem -K .\conf\key.pem -p [YOUR_PORT]
```

---

## Connect to EC2 

```
$ ssh -i [YOUE_KEY.pem] [YOUR_EC2]
$ scp -i [YOUE_KEY.pem] [YOUR_FILE] [YOUR_EC2]:[YOUR_FOLDER]
```

---

## minify html and JS files

use node modula terser to make the javascript file minify and compress

    terser js/networkAgentVR.js js/whiteList.min.js js/aframe-gif-shader.js js/aframe-extras.js js/VRFunc.js -o lib/appVR.min.js -c -m

---
