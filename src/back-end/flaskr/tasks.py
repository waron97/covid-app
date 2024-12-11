from celery import shared_task

@shared_task(ignore_result=False)
def add_together(a: int, b: int) -> int:
    return {"addedValue": a + b}