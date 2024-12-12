import re
import datetime

def parse_date(date_string):
    """
    Validates that a date string is a valid date and returns the parsed
    datetime object
    """
    pat = r"^[0-9]{4,}-(0|1)[0-9]-[0-3][0-9]$"
    if date_string and re.match(pat, date_string):
        return datetime.datetime.strptime(date_string, "%Y-%m-%d")
    return None