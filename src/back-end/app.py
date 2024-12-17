from flask import Flask
import os
from flaskr.celery_maker import celery_init_app
from flaskr import api
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


print("\n########### SERVER START ###########\n")

app = Flask(__name__)
CORS(app)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per minute"],
    storage_uri=os.environ.get("REDIS_URI"),
)

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

