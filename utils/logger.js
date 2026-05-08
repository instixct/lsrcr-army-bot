const chalk = require("chalk");


function logLine(label, value, color = "#00fd8b") {
    console.log(chalk.hex(color)(`> ${label}: ${value}`));
}

module.exports = {
	logLine
};
