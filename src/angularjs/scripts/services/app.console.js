if (localStorage.getItem('consoleLog') === null) {
    localStorage.setItem('consoleLog', '0');
}
const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace'];
const originalConsole = {};
consoleMethods.forEach(method => {
    originalConsole[method] = console[method];
    console[method] = function (...args) {
        if (localStorage.getItem('consoleLog') === '1') {
            originalConsole[method].apply(console, args);
        }
    };
});
