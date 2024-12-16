cd ..
rsync \
    -v \
    -r \
    --exclude .git \
    --exclude covid-data \
    --exclude docker-volumes \
    --exclude src/front-end/node_modules \
    --exclude src/back-end/venv \
    ./ carrots:~/rapsodoo/

ssh carrots "cd rapsodoo/devops; ./run-prod.sh";