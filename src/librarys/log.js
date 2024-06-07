import dayjs from "dayjs";

function getTime() {
    return dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS");
}

export const Log = {
    element: null,

    watchTable: [],

    info: (...message) => {
        console.log(`[${getTime()}][INFO]`, ...message);
    },
    warn: (...message) => {
        console.warn(`[${getTime()}][WARN]`, ...message);
    },
    error: (...message) => {
        console.error(`[${getTime()}][ERROR]`, ...message);
    },
    watch: (key, value) => {
        const item = Log.watchTable.find((item) => item.key === key);

        if (item) {
            item.value = value;
        } else {
            Log.watchTable.push({ key, value });
        }
    },

    watchVector: (key, vector) => {
        const precision = 2;
        const value = `(${vector.x.toFixed(precision)}, ${vector.y.toFixed(precision)}, ${vector.z.toFixed(precision)})`;
        Log.watch(key, value);
    },

    _flushWatch: () => {
        if (Log.watchTable.length === 0) return;

        Log.element.textContent = Log.watchTable
            .map(({ key, value }) => `${key}: ${value}`)
            .join("\n");
    },
};
