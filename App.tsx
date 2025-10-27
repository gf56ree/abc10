import React, { useMemo } from 'react';
import { GridCell } from './types';

const App: React.FC = () => {
  // Memoized calendar and schedule constants to prevent recalculation on re-renders
  const calendarInfo = useMemo(() => {
    const YEAR = 2025;
    const MONTH = 10; // November (0-indexed, so 10 is November)
    const date = new Date(YEAR, MONTH, 1);
    const monthName = date.toLocaleString('ja-JP', { month: 'long' });
    const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const holidays = [5, 6, 10, 25];

    return { YEAR, MONTH, monthName, daysInMonth, dayNames, hours, holidays };
  }, []);

  const { YEAR, MONTH, monthName, daysInMonth, dayNames, hours, holidays } = calendarInfo;

  // Determines the assigned instructor for a given day and hour based on business rules
  const getInstructor = (day: number, hour: number): string | null => {
    // New rule for Sosa
    if ((day === 9 || day === 16 || day === 29) && (hour >= 8 && hour <= 9)) {
      return "Sosa";
    }
    
    // Rule for day 13
    if (day === 13) {
      if (hour >= 10 && hour <= 20) {
        return "Gota";
      }
      return null;
    }

    // Special rule for day 20
    if (day === 20) {
      if (hour >= 11 && hour <= 13) {
        return "Emi";
      }
      return null; // All other times on the 20th are empty
    }

    // Rule 1: Gota's exception days
    if ((day === 17 || day === 28) && (hour >= 10 && hour <= 16)) {
      return "Gota";
    }
    // Rule 2: Emi's exception days and times
    if ((day === 3 || day === 24) && (hour >= 11 && hour <= 13)) {
      return "Emi";
    }
    // Rule 3: Gota's default evening schedule
    if (hour >= 17 && hour <= 20) {
      return "Gota";
    }
    // Rule 4: Kayo's default daytime schedule
    if (hour >= 10 && hour <= 16) {
      return "Kayo";
    }
    return null;
  };

  // Memoized generation of the entire schedule grid, including rowspan calculations
  const scheduleGrid = useMemo<GridCell[][]>(() => {
    const grid: GridCell[][] = [];

    // Initialize an empty grid structure
    for (let h_idx = 0; h_idx < hours.length; h_idx++) {
      grid[h_idx] = [];
      for (let d_idx = 0; d_idx < daysInMonth; d_idx++) {
        grid[h_idx][d_idx] = { instructor: null, rowspan: 1, hidden: false };
      }
    }

    // Populate the grid with instructors and calculate rowspans for merged cells
    for (let day = 1; day <= daysInMonth; day++) {
      const d_idx = day - 1;

      // Handle holidays first, merging all hour cells for that day
      if (holidays.includes(day)) {
        grid[0][d_idx] = { instructor: "休み", rowspan: hours.length, hidden: false };
        for (let h_idx = 1; h_idx < hours.length; h_idx++) {
          grid[h_idx][d_idx].hidden = true;
        }
        continue;
      }

      // Process non-holiday days
      for (let h_idx = 0; h_idx < hours.length; h_idx++) {
        if (grid[h_idx][d_idx].hidden) continue;

        const hour = hours[h_idx];
        const instructor = getInstructor(day, hour);
        grid[h_idx][d_idx].instructor = instructor;

        if (!instructor) continue;

        // Calculate rowspan by checking consecutive hours for the same instructor
        let span = 1;
        for (let next_h_idx = h_idx + 1; next_h_idx < hours.length; next_h_idx++) {
          if (getInstructor(day, hours[next_h_idx]) === instructor) {
            grid[next_h_idx][d_idx].hidden = true;
            span++;
          } else {
            break;
          }
        }
        grid[h_idx][d_idx].rowspan = span;
      }
    }
    return grid;
  }, [daysInMonth, hours, holidays]);

  // Color mapping for each instructor
  const instructorColors: { [key: string]: string } = {
    'Gota': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    'Kayo': 'bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-100',
    'Emi':  'bg-lime-200 text-lime-800 dark:bg-lime-800 dark:text-lime-100',
    'Sosa': 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    'Nozomi': 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    'Hanako': 'bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100',
  };

  return (
    <div className="antialiased text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col">
      <header className="relative text-center mb-6">
        <div className="absolute top-0 right-0 text-lg font-bold text-gray-700 dark:text-gray-300">３F</div>
        <h1 className="text-3xl font-bold tracking-tight text-primary-700 dark:text-primary-400">
          I&B Pilates スケジュール
        </h1>
        <p className="mt-1 text-xl text-gray-600 dark:text-gray-400">{YEAR}年 {monthName}</p>
      </header>

      <main className="flex-grow w-full max-w-full overflow-hidden">
        <div className="w-full h-full overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="sticky top-0 left-0 z-30 p-2 border-b border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"></th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const date = new Date(YEAR, MONTH, day);
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isHoliday = holidays.includes(day);

                  let thClass = 'sticky top-0 z-20 p-2 border-b border-r border-gray-300 dark:border-gray-600 whitespace-nowrap ';
                  if (isHoliday) thClass += 'bg-red-100 dark:bg-red-900/40 ';
                  else if (isWeekend) thClass += 'bg-gray-100 dark:bg-gray-800/60 ';
                  else thClass += 'bg-gray-50 dark:bg-gray-700/50 ';

                  let dayOfWeekClass = 'font-normal ';
                  if (dayOfWeek === 0) dayOfWeekClass += 'text-red-600 dark:text-red-400';
                  if (dayOfWeek === 6) dayOfWeekClass += 'text-blue-600 dark:text-blue-400';

                  return (
                    <th key={day} scope="col" className={thClass}>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{day}</div>
                      <div className={dayOfWeekClass}>({dayNames[dayOfWeek]})</div>
                    </th>
                  );
                })}
                <th scope="col" className="sticky top-0 right-0 z-30 p-2 border-b border-l border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {hours.map((hour, h_idx) => (
                <tr key={hour}>
                  <th scope="row" className="sticky left-0 p-2 border-b border-r border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 whitespace-nowrap z-20">
                    {hour}:00
                  </th>
                  {Array.from({ length: daysInMonth }, (_, d_idx) => {
                    const day = d_idx + 1;
                    const cellData = scheduleGrid[h_idx][d_idx];

                    if (cellData.hidden) {
                      return null;
                    }

                    const date = new Date(YEAR, MONTH, day);
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isHoliday = holidays.includes(day);

                    let cellClass = 'border-r border-b border-gray-300 dark:border-gray-600 font-medium align-top ';
                    if (cellData.instructor === '休み') {
                      cellClass += 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs p-1 pt-2';
                    } else if (cellData.instructor) {
                      cellClass += `${instructorColors[cellData.instructor]} p-2`;
                    } else {
                      if (isHoliday) {
                        cellClass += 'bg-red-50 dark:bg-red-900/30 ';
                      } else if (isWeekend) {
                        cellClass += 'bg-gray-100 dark:bg-gray-900/40 ';
                      } else if (day === 20) {
                        cellClass += 'bg-gray-100 dark:bg-gray-700/50 ';
                      }
                    }

                    return (
                      <td key={day} rowSpan={cellData.rowspan} className={`${cellClass} relative`}>
                        {cellData.rowspan > 1 && Array.from({ length: cellData.rowspan - 1 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 h-px bg-gray-300/70 dark:bg-gray-600/70"
                            style={{ top: `calc(${(i + 1) * 100 / cellData.rowspan}%)` }}
                          />
                        ))}
                        <span className="relative z-10">{cellData.instructor}</span>
                      </td>
                    );
                  })}
                   <th scope="row" className="sticky right-0 p-2 border-b border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 whitespace-nowrap z-20">
                    {hour}:00
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="mt-8 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-end">
        <div className="text-left text-xs">
            <p>※このスケジュールはあくまでも予定です。</p>
            <p>こちらの都合でインストラクターが変更にになる場合がございます。</p>
            <p>あらかじめご了承ください。</p>
        </div>
        <div className="flex justify-end items-center space-x-4 flex-wrap gap-y-2">
          {Object.entries(instructorColors).map(([name, className]) => (
            <div key={name} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${className.split(' ')[0]}`}></span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
