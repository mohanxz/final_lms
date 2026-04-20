import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CustomCalendar.css'; // <-- custom CSS override

function CalendarWidget({ date, setDate }) {
  return (
    <div className="rounded-lg shadow p-8 bg-white dark:bg-gray-800 max-w-sm mx-auto">
      <Calendar onChange={setDate} value={date} />
    </div>
  );
}

export default CalendarWidget;
