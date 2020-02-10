# Docker build

## Build docker file

Change the directory to the parent of **dockerfile/** and build.

    cd ..
    sudo docker build -f ./dockerfile/node.dockerfile -t mifly-web-ar:v1 .

## Run webservice

    sudo docker run -d -p $HOST_IP:80:8080 mifly-web-ar:v1

# Use Docker-compose

Change the directory to the parent of **dockerfile/** and build.

    cd ..
    sudo docker-compose up

Stop and remove the composed image. 
    sudo docker-compose stop
    sudo docker-compose rm
    

