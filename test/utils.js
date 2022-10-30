const getArgsFromEvent = ({ events, eventName }) => {
    let eventArgs = {}

    for (const event of events) {
        if (event?.event === eventName) {
            eventArgs = event.args
        }
    }

    return eventArgs
}

module.exports = { getArgsFromEvent }
