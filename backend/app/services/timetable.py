# https://icalendar.readthedocs.io/en/stable/ <- guide to iCalendar
import icalendar
from datetime import datetime

from app.models.availability import Availability, DayOfWeek, TimeBlock

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

WEEKDAY_TO_DAY = {
    0: DayOfWeek.monday,
    1: DayOfWeek.tuesday,
    2: DayOfWeek.wednesday,
    3: DayOfWeek.thursday,
    4: DayOfWeek.friday,
    5: DayOfWeek.saturday,
    6: DayOfWeek.sunday,
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

def find_availability(calendar: icalendar.Calendar) -> set[TimeBlock]:
    availability = set()

    for component in calendar.walk():

        if component.name == "VEVENT":
            start, end = extract_event_dates(component)

            if isinstance(start, datetime):
                day = start.weekday()
                occupied_blocks = find_occupied_blocks(day, start, end)
                availability.update(occupied_blocks)

    return availability

def find_occupied_blocks(day: int, start: datetime, end: datetime) -> list[tuple[DayOfWeek, TimeBlock | str]]:
    occupied_blocks: list[tuple[DayOfWeek, TimeBlock]] = []
    day_enum = WEEKDAY_TO_DAY.get(day)

    if day_enum is None:
        return []

    for hour in range(start.hour, end.hour):
        hour_block = hour_to_block(hour)
        if hour_block is not None:
            occupied_blocks.append((day_enum, hour_block))

    return occupied_blocks

def find_available_blocks(occupied: set[tuple[DayOfWeek, TimeBlock]]) -> set[tuple[DayOfWeek, TimeBlock]]:
    all_slots = {(day, block) for day in DayOfWeek for block in TimeBlock}
    return all_slots - occupied