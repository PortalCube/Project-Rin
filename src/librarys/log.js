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
    log: (...message) => {
        console.Log(`[${getTime()}][Log]`, ...message);
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
        const value = `(${vector.x.toFixed(3)}, ${vector.y.toFixed(3)}, ${vector.z.toFixed(3)})`;
        Log.watch(key, value);
    },

    _flushWatch: () => {
        if (Log.watchTable.length === 0) return;

        Log.element.textContent = Log.watchTable
            .map(({ key, value }) => `${key}: ${value}`)
            .join("\n");
    },
};
