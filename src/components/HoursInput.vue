<template>
    <input type="text" class="form-control"
           ref="input"
           v-bind="$attrs"
           :value="displayValue"
           :class="{'is-warning': computedValue !== 0 && (computedValue < minWarningThreshold || computedValue > maxWarningThreshold)}"
           @change="onInput($event.target.value)"
           @keydown.prevent.stop.up="increaseValue($event)"
           @keydown.prevent.stop.down="decreaseValue($event)"
           autocomplete="off"
    >
</template>

<script>

import Rounding from '@/lib/rounding';

const dhmRgx = /^(?:(?<d>\d+)\s*d)?\s*(?:(?<h>\d+)\s*[h:])?\s*(?:(?<m>\d+)\s*m?)?$/;
const decimalRgx = /^(\d+|\d+[,.]\d*|[,.]\d+)$/;

export default {
    name: "HoursInput",
    props: {
        value: {
            type: Number,
            default: 0,
        },
        hoursThreshold: {
            type: Number,
            default: 10, // 10h
        },
        step: {
            type: Number,
            default: 15 / 60, // 15m
        },
        smallStep: {
            type: Number,
            default: 5 / 60, // 5m
        },
        bigStep: {
            type: Number,
            default: 1, // 1h
        },
        hoursPerDay: {
            type: Number,
            default: 8, // 8h
        },
        minWarningThreshold: {
            type: Number,
            default: 15 / 60, // 15m
        },
        maxWarningThreshold: {
            type: Number,
            default: 8, // 8h
        },
        displayMode: {
            type: String,
            default: 'hm',
            validator: value => ['hm', 'clock', 'decimal'].includes(value),
        }
    },
    data () {
        return {
            computedValue: 0,
        };
    },
    computed: {
        displayValue () {
            switch (this.displayMode) {
                case 'hm':
                    return (
                        `${this.hours ? this.hours + 'h' : ''}`
                        + ` ${this.minutes ? this.minutes + 'm' : ''}`
                    ).trim();
                case 'clock':
                    return this.computedValue ? `${this.hours}:${('00' + this.minutes).slice(-2)}` : '';
                case 'decimal':
                    return this.computedValue ? this.computedValue.toString() : '';
            }
            return null;
        },
        hours () {
            return Math.floor(this.computedValue);
        },
        minutes () {
            return Math.round(this.computedValue * 60 % 60);
        }
    },
    methods: {
        onInput (value) {
            this.setValue(this.parseValue(value));
            this.emitValue();
        },
        parseValue (value) {
            if (!value) {
                return null;
            }
            value = value.trim();
            let match;
            if ((match = value.match(decimalRgx))) {
                let numberValue = parseFloat(value);
                if (!isNaN(numberValue)) {
                    if (numberValue >= this.hoursThreshold) {
                        numberValue /= 60;
                    }
                    return numberValue;
                }
            }
            if ((match = value.match(dhmRgx))) {
                return ((match.groups.d || 0) * this.hoursPerDay)
                    + ((match.groups.h || 0) * 1) // make sure we get a number
                    + ((match.groups.m || 0) / 60);
            }
            return null;
        },
        setValue (value) {
            if (value == null) {
                this.computedValue = 0;
            } else if (value < 0) {
                this.computedValue = 0;
            } else {
                this.computedValue = Math.round(value * 60) / 60;
            }
        },
        increaseValue (event) {
            let step = this.getStepSize(event);
            this.setValue(this.parseValue(event.target.value));
            this.setValue(Rounding.floor(this.computedValue, step) + step);
            this.emitValue();
        },
        decreaseValue (event) {
            let step = this.getStepSize(event);
            this.setValue(this.parseValue(event.target.value));
            this.setValue(Rounding.ceil(this.computedValue, step) - step);
            this.emitValue();
        },
        getStepSize (event) {
            if (event && event.shiftKey) {
                return this.bigStep;
            }
            if (event && event.altKey) {
                return this.smallStep;
            }
            return this.step;
        },
        emitValue () {
            this.$emit('input', this.computedValue);
        },
        focus () {
            this.$refs.input.focus();
        },
    },
    watch: {
        value (value) {
            this.setValue(value);
        },
    }
}
</script>

