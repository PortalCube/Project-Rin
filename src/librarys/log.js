import dayjs from "dayjs";

function getTime() {
    return dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS");
}

export const Log = {
    element: null,

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
    watch: (message) => {
        if (Log.element === null) {
            return;
        }

        Log.element.textContent = message;
    },
};
