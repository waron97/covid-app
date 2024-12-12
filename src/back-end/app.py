from flask import Flask
import os
from flaskr.celery_maker import celery_init_app
from flaskr import tasks, api
from celery.result import AsyncResult
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
    result = tasks.add_together.delay(10, 20)
    print(result)
    return "<p>Hello, World!</p>"

@app.get("/result/<id>")
def task_result(id: str) -> dict[str, object]:
    result = AsyncResult(id)
    return {
        "ready": result.ready(),
        "successful": result.successful(),
        "value": result.result if result.ready() else None,
    }