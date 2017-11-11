var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');
var Table = require('cli-table');

var keys = require('./keys.js');		//Contains the host, port, user, password, and database to be used for in the mySQL database

var connection = mysql.createConnection(keys.connection);

connection.connect(function(err) {
    if (err) throw err;
});

function selection() {
	console.log("");
	inquirer.prompt([
		{
			type: "rawlist",
			message: "What would you like to do?",
			choices: ["View Products Sales by Department", "Create New Department", "Exit"],
			name: "action"
		},
	]).then(function (user) {
		switch(user.action) {
			case "View Products Sales by Department":
				viewByDepartment();
				break;
			case "Create New Department":
				newDepartment();
				break;
			case "Exit":
				exit();
				break;
		}
	});
}

function viewByDepartment() {
	connection.query('SELECT * FROM departments', function(err, res) {
	    if (err) throw err;

		var table = new Table({
			head: ["Department ID".cyan, "Department Name".cyan, "Overhead Costs".cyan, "Product Sales".cyan, "Total Profit".cyan],
			colWidths: [20, 20, 20, 20, 20],
		});
		
		for(var i = 0; i < res.length; i++) {
			var profit = parseFloat(res[i].TotalSales - res[i].OverHeadCosts).toFixed(2);

			table.push(
			    [res[i].DepartmentID, res[i].DepartmentName, parseFloat(res[i].OverHeadCosts).toFixed(2), parseFloat(res[i].TotalSales).toFixed(2), profit]
			);
		}
		
		console.log(table.toString());

		selection();
	});
}

function newDepartment() {
	inquirer.prompt([
	{
		type: "input",
		message: "What is the department name?",
		name: "dptName"
	},
	{
		type: "number",
		message: "What is this department's overhead cost?",
		name: "dptOverhead"
	},
	{
		type: "number",
		message: "What is the current total sales for this department?",
		name: "dptSales"
	},
	]).then(function (user) {
		connection.query("INSERT INTO departments SET ?", {
			DepartmentName: user.dptName,
			OverHeadCosts: user.dptOverhead,
			TotalSales: user.dptSales
		}, function(err, res) {
			if(err) throw err;

			console.log("\nYour department has been added!\n");
			selection();
		});
	});
}

function exit() {
	connection.end();
	console.log("Good Bye!");
}

selection();