# https://icalendar.readthedocs.io/en/stable/ <- guide to iCalendar
import icalendar
from datetime import datetime

from app.models.availability import TimeBlock

HOUR_TO_BLOCK = {
    0: TimeBlock.twelve_am,
    1: TimeBlock.one_am,
    2: TimeBlock.two_am,
    3: TimeBlock.three_am,
    4: TimeBlock.four_am,
    5: TimeBlock.five_am,
    6: TimeBlock.six_am,
    7: TimeBlock.seven_am,
    8: TimeBlock.eight_am,
    9: TimeBlock.nine_am,
    10: TimeBlock.ten_am,
    11: TimeBlock.eleven_am,
    12: TimeBlock.twelve_pm,
    13: TimeBlock.one_pm,
    14: TimeBlock.two_pm,
    15: TimeBlock.three_pm,
    16: TimeBlock.four_pm,
    17: TimeBlock.five_pm,
    18: TimeBlock.six_pm,
    19: TimeBlock.seven_pm,
    20: TimeBlock.eight_pm,
    21: TimeBlock.nine_pm,
    22: TimeBlock.ten_pm,
    23: TimeBlock.eleven_pm,
}

def parse_ical(data: bytes):
    calendar = icalendar.Calendar.from_ical(data)
    return calendar

def extract_event_dates(component: icalendar.Event):
    start = component.get("DTSTART").dt
    end = component.get("DTEND").dt
    return start, end

def hour_to_block(hour: int) -> str | None:
    return HOUR_TO_BLOCK.get(hour)

def find_occupied_blocks(start: datetime, end: datetime) -> list[TimeBlock]: