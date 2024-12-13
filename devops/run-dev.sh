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
    docker compose --env-file ./.env.development -f ./docker/docker-compose.dev.yaml up --build
}

function runBe() {
    cd ../src/back-end
    source venv/bin/activate
    python startup.py
    flask --app app --debug run & celery -A app.celery_app worker --loglevel INFO
}

function runFe() {
    cd ../src/front-end
    yarn run dev -p
}

# Main program

pullCovidData

if [[ $1 == "tmux" ]]
then
    tmuxinator stop .
    tmuxinator start .
    # After detaching
    echo "Stopping tmuxinator"
    tmuxinator stop .
else
    export $(sed 's/#.*//g' .env.development | xargs)
    runDocker & runBe & runFe & wait 
fi

docker compose --env-file ./.env.development -f ./docker/docker-compose.dev.yaml down