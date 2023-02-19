'use strict';

export default {
    weekStartEnd(date, startDay = 1) {
        const curr = new Date(date); // Clone date to prevent changes
        const weekStart = new Date(curr.setDate(curr.getDate() - (7 + curr.getDay() - startDay) % 7));
        const weekEnd = new Date(curr.setDate(curr.getDate() + 6));
        return [weekStart, weekEnd];
    },

    formatDate(date) {
        if (!date) {
            return null;
        }
        const mm = ('' + (date.getMonth() + 1)).padStart(2, '0');
        const dd = ('' + date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${mm}-${dd}`;
    },
};
