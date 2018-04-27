// flow
/* eslint-disable import/prefer-default-export, prefer-template */
import moment from 'moment';
import type { MonthNumberType, MonthType, DayType } from '../types';

const MONDAY_FIRST = [6, 0, 1, 2, 3, 4, 5];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isValidDate(date: Date): boolean {
  // eslint-disable-next-line
  return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
}

export function markSelectedDays(
  monthIndex: number,
  days: Array<DayType>,
  startDate: Date,
  endDate?: Date,
): Array<DayType> {
  return days.map((day: DayType): DayType => {
    if (!endDate) {
      const isChosenDate = day.date.getTime() === startDate.getTime();
      return {
        ...day,
        isEndDate: isChosenDate,
        isStartDate: isChosenDate,
        isActive: isChosenDate,
      };
    }

    return {
      ...day,
      isStartDate: day.isMonthDate && day.date.getTime() === startDate.getTime(),
      isEndDate: day.isMonthDate && day.date.getTime() === endDate.getTime(),
      isActive: day.isMonthDate && day.date >= startDate && day.date <= endDate,
    };
  });
}

function getDaysOfMonth(
  monthNumber: number,
  year: number,
  startDate?: Date,
  endDate?: Date,
  minDate?: Date,
  maxDate?: Date,
): Array<DayType> {
  const startDayOfMonth = moment([year, monthNumber - 1]);
  const daysToAdd = getNumberOfDaysInMonth(monthNumber);

  const days:Array<DayType> = [];

  const startWeekOffset = MONDAY_FIRST[startDayOfMonth.day()];
  const firstMonthDay = startDayOfMonth.toDate();
  const daysToCompleteRows = (startWeekOffset + daysToAdd) % 7;
  const endMonthDays = daysToCompleteRows ? 7 - daysToCompleteRows : 0;

  for (let i = -startWeekOffset; i < daysToAdd + endMonthDays; i++) {
    const date: Date = addDays(firstMonthDay, i);
    const day: number = date.getDate();
    const month: number = date.getMonth() + 1;
    const fullDay: string = day < 10 ? '0' + day : day;
    const fullMonth: string = month < 10 ? '0' + month : month;
    const id: string = date.getFullYear() + '-' + fullMonth + '-' + fullDay;

    let isOnSelectedRange = !minDate && !maxDate;

    isOnSelectedRange = (!minDate || (minDate && date >= minDate))
      && (!maxDate || (maxDate && date <= maxDate));

    const isMonthDate = (i >= 0 && i < daysToAdd);
    let isStartDate = false;
    let isEndDate = false;
    let isActive = false;

    if (endDate && startDate) {
      isStartDate = isMonthDate && date.getTime() === startDate.getTime();
      isEndDate = isMonthDate && date.getTime() === endDate.getTime();
      isActive = (isMonthDate && (date >= startDate && date <= endDate));
    } else if (startDate && date.getTime() === startDate.getTime()) {
      isStartDate = true;
      isEndDate = true;
      isActive = true;
    }

    days.push({
      id: `${monthNumber}-${id}`,
      date,
      isMonthDate,
      isActive,
      isStartDate,
      isEndDate,
      isVisible: isOnSelectedRange && isMonthDate,
    });
  }

  return days;
}

export function getMonthsList(
  startingMonth: Date,
  monthsLength: number,
  visibleMonthsCount: number,
  startDate?: Date,
  endDate?: Date,
  minDate?: Date,
  maxDate?: Date,
): Array<MonthType> {
  const months: Array<MonthType> = [];
  let year: number = startingMonth.getFullYear();
  let monthNumber = startingMonth.getMonth() + 1;
  let count = 0;

  months.push({
    id: `${year}-${monthNumber}`,
    monthNumber,
    year,
    name: MONTH_STRINGS[monthNumber - 1] + ' ' + year,
    days: getDaysOfMonth(monthNumber, year, startDate, endDate, minDate, maxDate),
    startDate,
    endDate,
    isVisible: true,
  });

  for (let monthCount = 0; monthCount < monthsLength; monthCount++) {
    if (monthNumber < 12) {
      monthNumber += 1;
    } else {
      monthNumber = 1;
      year++;
    }

    count += 1;

    months.push({
      id: `${year}-${monthNumber}`,
      monthNumber,
      year,
      name: MONTH_STRINGS[monthNumber - 1] + ' ' + year,
      days: getDaysOfMonth(monthNumber, year, startDate, endDate, minDate, maxDate),
      startDate,
      endDate,
      isVisible: count < visibleMonthsCount,
    });
  }

  return months;
}

function getInitialMonths(
  months: Array<MonthType>,
  firstMonthIndex: number,
  maxListSize: number,
): Array<MonthType> {
  if (firstMonthIndex) {
    const listSize = months.length;
    if (firstMonthIndex === listSize) {
      return months;
    }

    const middle = Math.round(listSize / 2);

    if (firstMonthIndex < middle) {
      const firsts = parseInt(maxListSize * 0.4, 10);
      const lasts = maxListSize - firsts;

      if (firstMonthIndex - firsts >= 0) {
        return months.slice(0, firstMonthIndex + lasts);
      }

      return months.slice(0, maxListSize);
    } else if (firstMonthIndex > middle) {
      const firsts = parseInt(maxListSize * 0.6, 10);
      const lasts = maxListSize - firsts;

      if (firstMonthIndex + lasts <= listSize) {
        return months.slice(0, firstMonthIndex + lasts);
      }

      return months;
    }

    return months.slice((middle) - (maxListSize / 2), (middle) + (maxListSize / 2));
  }

  return months.slice(0, maxListSize);
}

export function getInitialMonthList(
  months: Array<MonthType>,
  startDate: Date,
  maxListSize: number,
  diffVisible: number,
): Array<MonthType> {
  if (maxListSize >= months.length) { return months; }

  const firstMonth = months.find((m: MonthType): boolean =>
    m.monthNumber - 1 === startDate.getMonth() && m.year === startDate.getFullYear());
  const firstMonthIndex = months.indexOf(firstMonth) || 0;
  const diff = firstMonthIndex > 0 ? diffVisible : diffVisible + 1;

  return getInitialMonths(
    months.map((m: MonthType, i: number): MonthType => ({
      ...m,
      isVisible: Math.abs(firstMonthIndex - i) <= diff,
    })),
    firstMonthIndex,
    maxListSize,
  );
}

function leapYear(year: number): boolean {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

// eslint-disable-next-line
function getNumberOfDaysInMonth(monthNumber: MonthNumberType, year: number): number {
  // eslint-disable-next-line
  switch (monthNumber) {
    case 1:
      return 31;
    case 2:
      return leapYear(year) ? 29 : 28;
    case 3:
      return 31;
    case 4:
      return 30;
    case 5:
      return 31;
    case 6:
      return 30;
    case 7:
      return 31;
    case 8:
      return 31;
    case 9:
      return 30;
    case 10:
      return 31;
    case 11:
      return 30;
    case 12:
      return 31;
  }
}

const MONTH_STRINGS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];