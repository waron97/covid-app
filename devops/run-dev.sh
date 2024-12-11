#!/bin/bash

function runDocker() {
    docker compose --env-file ./.env.development -f ./docker/docker-compose.dev.yaml up --build
}

function runBe() {
    cd ../src/back-end
    source venv/bin/activate
    flask --app app --debug run & celery -A app.celery_app worker --loglevel INFO
}

function runFe() {
    cd ../src/front-end
    yarn run dev
}

if [[ $1 == "tmux" ]]
then
    tmuxinator stop .
    tmuxinator start .
else
    export $(sed 's/#.*//g' .env.development | xargs)
    runDocker & runBe & runFe & wait 
fi

docker compose --env-file ./.env.development -f ./docker/docker-compose.dev.yaml down