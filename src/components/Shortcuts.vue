<template>
    <article>
        <section>
            <header><h6>Global</h6></header>
            <div class="shortcut">
                <kbd>?</kbd>
                Toggle keyboard shortcuts help dialog.
            </div>
            <div class="shortcut">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                Submit form.
            </div>
            <div class="shortcut">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd>
                Submit and clear form.
            </div>
        </section>
        <section>
            <header><h6>Date navigation</h6></header>
            <div class="shortcut">
                <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>←</kbd>
                Navigate to previous day.
            </div>
            <div class="shortcut">
                <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>←</kbd>
                Navigate to previous week (i.e. -7 days).
            </div>
            <div class="shortcut">
                <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>→</kbd>
                Navigate to next day.
            </div>
            <div class="shortcut">
                <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>→</kbd>
                Navigate to next week (i.e. +7 days).
            </div>
            <div class="shortcut">
                <kbd>Alt</kbd> + <kbd>t</kbd>
                Navigate to today.
            </div>
        </section>
        <section>
            <header><h6>Field focus</h6></header>
            <div class="row">
                <div class="col">
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>a</kbd>
                        Focus <em>Date</em> input.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>p</kbd>
                        Focus <em>Project</em> selector.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>i</kbd>
                        Focus <em>Service</em> selector.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>u</kbd>
                        Focus <em>Hours Type</em> selector.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>h</kbd>
                        Focus <em>Hours</em> input.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>j</kbd>
                        Focus <em>Jira Issue</em> selector.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>o</kbd>
                        Focus <em>Comment</em> input.
                    </div>
                </div>
                <div class="col">
                    <div class="alert alert-info p-2 mt-2 mb-0">
                        These focus shortcuts also work without the <kbd>Alt</kbd> modifier when no other button/input/etc is focused.
                    </div>
                </div>
            </div>
        </section>
        <section>
            <header><h6>Hours input</h6></header>
            <div class="row">
                <div class="col">
                    <div class="shortcut">
                        <kbd>↑</kbd>
                        Increment with 15 minutes.
                    </div>
                    <div class="shortcut">
                        <kbd>Shift</kbd> + <kbd>↑</kbd>
                        Increment with 1 hour.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>↑</kbd>
                        Increment with 5 minutes.
                    </div>
                    <div class="shortcut">
                        <kbd>↓</kbd>
                        Decrement with 15 minutes.
                    </div>
                    <div class="shortcut">
                        <kbd>Shift</kbd> + <kbd>↓</kbd>
                        Decrement with 1 hour.
                    </div>
                    <div class="shortcut">
                        <kbd>Alt</kbd> + <kbd>↓</kbd>
                        Decrement with 5 minutes.
                    </div>
                </div>
                <div class="col">
                    <div class="alert alert-info">
                        When the Hours value is not dividable by the chosen modifier the value get first ceiled/floored to the next value instead of incrementing/decrementing.<br>
                        I.e. <em>15m</em> → <kbd>Shift</kbd> + <kbd>↑</kbd> → <em>1h</em> → <kbd>Shift</kbd> + <kbd>↑</kbd> → <em>2h</em>.
                    </div>
                </div>
            </div>
        </section>
    </article>
</template>

<script>
export default {
    name: 'Shortcuts',
}
</script>
