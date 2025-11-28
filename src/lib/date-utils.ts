export const computeAge = (created: string | number | Date | null | undefined): string => {
    if (!created || created === '-' || created === 'Unknown' || created === 'Loading...') return 'Unknown';

    let d: Date;

    if (typeof created === 'number') {
        // Assume timestamp in seconds if small, milliseconds if large
        // But usually APIs return seconds for creation_date
        d = new Date(created * 1000);
        // If year is > 3000, maybe it was milliseconds? 
        // But let's stick to standard logic: if it's very small, it's seconds.
        // However, JS Date constructor takes ms. 
        // Let's assume input might be a string date or a timestamp.
        // If the caller passes a raw timestamp number, they should probably handle the *1000 before.
        // But for safety, let's check if the date looks valid.
        if (d.getFullYear() > 3000 || d.getFullYear() < 1970) {
            d = new Date(created); // Try as ms
        }
    } else {
        d = new Date(created);
    }

    if (isNaN(d.getTime())) return 'Unknown';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Unknown'; // Future date?
    if (diffDays === 0) return 'Less than 1 day';

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = Math.floor((diffDays % 365) % 30);

    const parts = [] as string[];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.length ? parts.join(" ") : "Less than 1 day";
};
