#!/bin/bash

# Helper functions

function pullCovidData() {
    echo "Pulling COVID-19 data..."
    if [ ! -d ../covid-data ]
    then
        echo "Covid data not found. Downloading..."
        git clone https://github.com/pcm-dpc/COVID-19.git ../covid-data
    else
        # Pull data then come back
        cd ../covid-data
        git pull
        cd ../devops
    fi
}

function runDocker() {
    docker compose -f ./docker/docker-compose.dev.yaml up --build -d
}

# Main program
pullCovidData
runDocker

if [[ $1 == "tmux" ]]
then
    tmuxinator stop .
    tmuxinator start .
    # After detaching
    echo "Stopping tmuxinator"
    tmuxinator stop .
else
    docker logs --follow covid-app-api
fi

docker compose --env-file ./.env.development -f ./docker/docker-compose.dev.yaml down