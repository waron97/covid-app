from flask import Flask
import os
from flaskr.celery_maker import celery_init_app
from flaskr import tasks, api
from flaskr import db

print("\n########### SERVER START ###########\n")

app = Flask(__name__)

app.register_blueprint(api.bp)

app.config.from_mapping(
    CELERY=dict(
        broker_url=os.environ.get("REDIS_URI"),
        result_backend=os.environ.get("REDIS_URI"),
        task_ignore_result=True,
    ),
)
celery_app = celery_init_app(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

