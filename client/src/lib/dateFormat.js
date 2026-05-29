export const dateFormat = (date) => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'short',
        month: 'long',           // June, July, etc.
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    })
}