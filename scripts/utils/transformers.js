function dateToString(date, showTime=true) {
    if (!(date instanceof Date)) {
        throw new TypeError('Input must be a Date object');
    }

    // If is from less than 7 days ago, just show how many days ago
    const now = new Date();
    const diffInMs = now - date;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInSeconds < 60) {
        return `Hace ${diffInSeconds} segundos`;
    }
    else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minutos`;
    }
    else if (diffInHours < 24) {
        return `Hace ${diffInHours} horas`;
    }
    else if (diffInDays < 7) {
        return `Hace ${diffInDays} días`;
    }

    if (showTime) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
    else {
        return date.toISOString().slice(0, 10);
    }
}