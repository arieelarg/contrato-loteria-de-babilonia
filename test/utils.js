const getArgsFromEvent = ({ events, eventName }) => {
    const [event] = events.filter(({ event }) => event == eventName)

    return event.args
}

module.exports = { getArgsFromEvent }
