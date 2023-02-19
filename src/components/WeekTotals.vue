<template>
    <section class="position-relative">
        <div class="d-flex flex-wrap gap-3">
            <div class="text-muted">This week:</div>
            <div v-for="(details, projectId) in projectTotals" :key="projectId" class="d-flex">
                <div class="me-1">{{ details.project.name }}<span class="text-muted">:</span></div>
                <div class="text-nowrap" style="width: 3em;" :title="`${details.percent.toFixed(2)}%`">
                    <strong>{{ details.hours.toFixed(2) }}</strong>
                    <div class="progress" style="height: 1px">
                        <div class="progress-bar" role="progressbar" :style="{width: `${details.percent}%`}"></div>
                    </div>
                </div>
            </div>
            <div v-if="Object.keys(projectTotals).length === 0" class="text-muted"><em>No logged hours yet.</em></div>
            <div class="text-primary"><span>Total</span>: <strong>{{ sum }} / {{ target !== null ? target : '?' }}</strong></div>
            <div v-if="!disableSubmissions" class="d-flex align-items-center gap-1">
                <span v-for="(details, day) in submitDayStatus"
                      :key="day"
                      class="badge submit-status"
                      :class="{'bg-gray text-dark': details.status === 'submitted' || (details.inFuture && !details.loggedHours), 'bg-danger': details.status === 'no_registrations', 'bg-success': details.status === 'yet_to_turn_in' && details.loggedHours >= details.hours, 'bg-warning': details.status === 'yet_to_turn_in' && details.loggedHours < details.hours}"
                      :title="`status: ${details.status}; ${(details.loggedHours || 0).toFixed(2)} of ${(details.hours || 0).toFixed(2)} hours logged. (Click to navigate)`"
                      :style="!disableNavigation ? 'cursor: pointer;' : null"
                      @click="!disableNavigation ? navigateDate(details.date): null"
                >{{ details.date ? details.date.toLocaleDateString('en', { weekday: 'short' }) : '??' }}</span>
                <button type="button" class="btn btn-xs" :class="submitReady ? 'btn-primary' : 'btn-secondary'" @click="submit" title="Submit all hours for this week">Submit</button>
            </div>
        </div>

        <div v-if="loading" class="loading-overlay">
            <div class="spinner-container">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: 'WeekTotals',
    props: {
        hours: {
            type: Array,
            required: true,
        },
        timeTable: {
            type: Object,
            required: false,
        },
        submissions: {
            type: Array,
            required: true,
        },
        disableSubmissions: {
            type: Boolean,
            default: false,
        },
        disableNavigation: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    computed: {
        projectTotals () {
            const totals = this.hours.reduce((result, hours) => {
                const key = `${hours.project.id}`;
                result[key] = result[key] || {
                    project: hours.project,
                    hours: 0,
                    percent: 0,
                }
                result[key].hours += hours.hours;
                return result;
            }, {});
            if (this.target) {
                for (let i in totals) {
                    totals[i].percent = 100 * totals[i].hours / this.target;
                }
            }
            return totals;
        },
        dayTotals () {
            return this.hours.reduce((result, hours) => {
                const key = hours.start_date.match(/\d{4}-\d{2}-\d{2}/)[0];
                result[key] ??= 0;
                result[key] += hours.hours;
                return result;
            }, {});
        },
        sum () {
            return this.hours.reduce((result, hours) => result + hours.hours, 0);
        },
        target () {
            return this.timeTable ? Object.values(this.timeTable).reduce((result, day) => result + day.hours, 0) : null;
        },
        submitDayStatus () {
            if (this.timeTable == null) {
                return {};
            }
            const now = new Date();
            const result = JSON.parse(JSON.stringify(this.timeTable));
            for (let [, submission] of this.submissions.entries()) {
                const date = new Date(`${submission.date}T00:00:00`);
                const dayNr = date.getDay() || 7; // sunday 0 -> 7
                result[`day_${dayNr}`] ??= {};
                result[`day_${dayNr}`].date = date;
                result[`day_${dayNr}`].status = submission.status;
                result[`day_${dayNr}`].loggedHours = this.dayTotals[submission.date] ?? 0;
                result[`day_${dayNr}`].inFuture = date > now;
            }

            return Object.fromEntries(Object.entries(result).filter(([,v]) => v.hours > 0 || v.loggedHours > 0 || v.status === 'yet_to_turn_in'))
        },
        submitReady () {
            return this.sum >= this.target && this.submissions.some((v) => v.status === 'yet_to_turn_in');
        },
    },
    methods: {
        submit () {
            if (window.confirm('Are you sure you want to (re)submit this week?')) {
                this.$emit('submit');
            }
        },
        navigateDate (date) {
            if (!this.disableNavigation) {
                this.$emit('navigate', date);
            }
        }
    },
}
</script>
