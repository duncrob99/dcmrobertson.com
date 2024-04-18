<script lang="ts">
    import { goto } from '$app/navigation';
    import { type TimeRange, type Appointment, AppointmentState } from '$lib/types';
    import { Time } from '$lib/types';
    import { tick, onMount } from 'svelte';

    export let appointments: Appointment[];
    export let startHour = 0;
    export let endHour = 24;
    let shortenDays = true;
    let days: HTMLDivElement;

    let showTimes = true;
    let testingTimeWidth = false;
    let appointmentsEl: HTMLDivElement;

    async function checkDayOverflow() {
        if (!days) return;
        shortenDays = false;
        await tick();
        for (const label of days.children) {
            if (label.scrollWidth > label.clientWidth) {
                shortenDays = true;
                break;
            }
        }
    }

    async function checkTimeOverflow() {
        if (!appointmentsEl) return;
        showTimes = true;
        testingTimeWidth = true;
        await tick();
        for (const appointment of appointmentsEl.children) {
            const timeStyle = window.getComputedStyle(appointment, ':after');
            const timeWidth = parseFloat(timeStyle.width);
            console.log(timeWidth, appointment.clientWidth);
            console.log(timeWidth > appointment.clientWidth);
            if (timeWidth > appointment.clientWidth) {
                console.log('hiding times due to ', appointment);
                console.log(timeWidth, appointment.clientWidth);
                showTimes = false;
                break;
            }
        }
        testingTimeWidth = false;
    }

    function getVisibleDuration(time: TimeRange): number {
        const start = Math.max(time.start.asQuarterHours(), startHour * 4);
        const end = Math.min(time.end.asQuarterHours(), endHour * 4);
        return end - start;
    }

    onMount(() => {
        checkDayOverflow();
        checkTimeOverflow();
        window.addEventListener('resize', checkDayOverflow);
        window.addEventListener('resize', checkTimeOverflow);
    });
</script>

<div class="calendar-container" style="--num-rows: {endHour - startHour}">
    <div bind:this={days} class="days">
        {#if shortenDays}
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
        {:else}
            <div>Sunday</div>
            <div>Monday</div>
            <div>Tuesday</div>
            <div>Wednesday</div>
            <div>Thursday</div>
            <div>Friday</div>
            <div>Saturday</div>
        {/if}
    </div>
    <div class="times">
        {#each Array.from({ length: endHour - startHour }, (_, i) => i + startHour) as hour}
            <div>{hour.toString().padStart(2, '0')}:00</div>
        {/each}
    </div>
    <div class="appointments" bind:this={appointmentsEl}>
        {#each appointments as appointment}
            {#if getVisibleDuration(appointment.time_range) >= 4}
                <div
                    class="appointment"
                    class:bookable={appointment.state === AppointmentState.Available}
                    class:booked={appointment.state === AppointmentState.Booked}
                    class:show-times={showTimes}
                    class:testing-time-width={testingTimeWidth}
                    style="grid-row: {Math.max(appointment.time_range.start.asQuarterHours() + 1 - startHour * 4, 1)}
                    / {Math.min(appointment.time_range.end.asQuarterHours() + 1 - startHour * 4, 4 * (endHour - startHour) + 1)};
                    grid-column: {appointment.time_range.day + 1} / {appointment.time_range.day + 2};
                    --duration: {getVisibleDuration(appointment.time_range)};"
                    data-start-hour={appointment.time_range.start.hour}
                    data-start-minute={appointment.time_range.start.minute.toString().padStart(2, '0')}
                    data-end-hour={appointment.time_range.end.hour}
                    data-end-minute={appointment.time_range.end.minute.toString().padStart(2, '0')}
                    >
                    {#each Array.from({ length: getVisibleDuration(appointment.time_range) - 3 }, (_, i) => i) as offset}
                        <a
                            href={`/contact?day=${appointment.time_range.day}&start=${Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset}&end=${
                            Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset + 4
                            }`}
                            style="--offset: {offset}"
                            aria-label="Inquire about {Time.fromQuarterHours(Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset)} - {Time.fromQuarterHours(Math.max(appointment.time_range.start.asQuarterHours(), startHour * 4) + offset + 4)}"/>
                    {/each}
                </div>
            {/if}
        {/each}
    </div>
    <div class="gridlines">
        {#each Array.from({ length: endHour - startHour }, (_, i) => i) as _}
            {#each Array.from({ length: 7 }, (_, i) => i) as _}
                <div />
            {/each}
        {/each}
                </div>
    </div>

<style lang="scss">
    @import 'global';

    .calendar-container {
        display: grid;
        grid-template-columns: min-content repeat(7, 1fr);
        grid-template-rows: min-content 1fr;
        --gridline-width: 1px;

        .gridlines {
            grid-column: 2 / -1;
            grid-row: 2 / -1;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(var(--num-rows), 1fr);
            gap: var(--gridline-width);

            & > div {
                outline: var(--gridline-width) solid grey;
            }
        }
    }

    .days {
        display: grid;
        grid-auto-columns: minmax(0, 1fr);
        grid-auto-flow: column;
        grid-column: 2 / -1;
        grid-row: 1 / 2;

        gap: var(--gridline-width);

        & > div {
            outline: var(--gridline-width) solid grey;
            padding: 0.5em 0;
            text-align: center;
        }
    }

    .times {
        display: grid;
        grid-template-rows: repeat(calc(var(--num-rows) * 4), 1fr);
        grid-column: 1 / 2;
        grid-row: 2 / -1;
        gap: var(--gridline-width);

        & > div {
            grid-row: span 4;
            padding: 1em;
            padding-top: 0;
            outline: var(--gridline-width) solid grey;
        }
    }

    .appointments {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: repeat(calc(var(--num-rows) * 4), 1fr);
        grid-column: 2 / -1;
        grid-row: 2 / -1;
    }

    .appointment {
        outline: 1px solid black;
        --margin: 0.2em;
        margin: var(--margin) calc(2 * var(--margin));
        border-radius: 0.2em;
        display: flex;
        flex-direction: column;
        position: relative;
        background: var(--inactive-background);

        &.bookable {
            --inactive-background: #4BB1FF;
            --hover-background: rgba(0, 0, 0, 0.3);
        }

        &.booked {
            --inactive-background: rgb(242, 104, 104);
            --hover-background: rgb(155, 28, 28);
            --repeat-length: 30px;
            --stripe-width: 10px;
            background: repeating-linear-gradient(
                25deg,
                var(--inactive-background),
                var(--inactive-background) calc(var(--repeat-length) - var(--stripe-width)),
                var(--hover-background) calc(var(--repeat-length) - var(--stripe-width)),
                var(--hover-background) var(--repeat-length)
            );
            
            a {
                pointer-events: none;
            }
        }

        &.show-times::after {
            content: attr(data-start-hour) ':' attr(data-start-minute) ' - ' attr(data-end-hour) ':'
                attr(data-end-minute);
            pointer-events: none;
            padding: 0.5em;
            position: absolute;
            top: 0;
            bottom: 0;
            overflow: hidden;
            width: calc(100% - 1.5em);
            min-width: min-content;
            box-sizing: border-box;
        }

        &.testing-time-width::after {
            width: min-content;
        }

        a {
            color: black;
            //flex-grow: 1;
            text-decoration: none;
            position: absolute;
            --whole-height: calc(100% + 2 * var(--margin));
            top: calc(var(--offset) * var(--whole-height) / var(--duration) - var(--margin));
            width: 100%;
            height: calc(var(--whole-height) / var(--duration) * 4);

            &:first-child, &:last-child {
                height: calc(var(--whole-height) / var(--duration) * 4 - var(--margin));
            }

            &:first-child:last-child {
                height: calc(var(--whole-height) / var(--duration) * 4 - 2*var(--margin));
            }

            &:first-child {
                top: 0;
                border-top-left-radius: 0.2em;
                border-top-right-radius: 0.2em;
            }

            &:last-child {
                border-bottom-left-radius: 0.2em;
                border-bottom-right-radius: 0.2em;
            }

            &:hover {
                background: var(--hover-background);

                /*
                & + a,
                & + a + a,
                & + a + a + a {
                    background-color: #00cc00;
                }
                */

                &::before {
                    position: absolute;
                    //top: calc(var(--offset) * var(--whole-height) / var(--duration) - var(--margin));
                    top: 0;
                    left: calc(100% + 0.1em);
                    content: attr(aria-label);
                    width: max-content;
                    background: white;
                    box-shadow: 5px 5px 8px rgba(0, 0, 0, 0.2);
                    border-radius: 0.5em;
                    border-top-left-radius: 0;
                    padding: 0.2em 0.5em;
                    z-index: 1;
                }
            }
        }
    }
</style>
