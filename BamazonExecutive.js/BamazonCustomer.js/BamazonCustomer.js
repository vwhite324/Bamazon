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
	connection.query('SELECT * FROM products', function(err, res) {
	    if (err) throw err;

		var table = new Table({
			head: ["Product ID".cyan, "Product Name".cyan, "Department Name".cyan, "Price".cyan, "Quantity".cyan],
			colWidths: [13, 20, 20, 13, 13],
		});
		
		for(var i = 0; i < res.length; i++) {
			table.push(
			    [res[i].itemID, res[i].ProductName, res[i].DepartmentName, parseFloat(res[i].Price).toFixed(2), res[i].StockQuantity]
			);
		}
		
		console.log(table.toString());

		inquirer.prompt([
			{
				type: "number",
				message: "Which item would you like to purchase? (the Product ID)",
				name: "itemNumber"
			},
			{
				type: "number",
				message: "How many would you like to buy?",
				name: "howMany"
			},
		]).then(function (user) {

			connection.query('SELECT * FROM products JOIN departments ON products.DepartmentName = departments.DepartmentName', function(err, res) {
		    	if (err) throw err;

		    	if(res[user.itemNumber - 1].StockQuantity > user.howMany) {
		    		var newQuantity = parseInt(res[user.itemNumber - 1].StockQuantity) - parseInt(user.howMany);
		    		var total = parseFloat(user.howMany) * parseFloat(res[user.itemNumber - 1].Price);
			    	total = total.toFixed(2);

			    	var departmentTotal = parseFloat(total) + parseFloat(res[user.itemNumber - 1].TotalSales);
			    	departmentTotal = departmentTotal.toFixed(2);

	    			connection.query("UPDATE departments SET ? WHERE ?", [{
		    			TotalSales: departmentTotal
		    		}, {
		    			DepartmentName: res[user.itemNumber - 1].DepartmentName
		    		}], function(error, results) {});

		    		connection.query("UPDATE products SET ? WHERE ?", [{
		    			StockQuantity: newQuantity
		    		}, {
		    			itemID: user.itemNumber
		    		}], function(error, results) {
		    			if(error) throw error;

			    		console.log("Your order for " + user.howMany + " " + res[user.itemNumber - 1].ProductName +
			    			"(s) has been placed.");
			    		console.log("Your total is $" + total);
			    		orderMore();
		    		});

		    	} else {
		    		console.log("We're sorry, we only have " + res[user.itemNumber - 1].StockQuantity + " of that product.");
		    		orderMore();
		    	}	    
			});
		});	
	});
}

function orderMore() {
	inquirer.prompt([
		{
			type: "confirm",
			message: "Would you like to order anything else?",
			name: "again"
		},
	]).then(function (user) {
		if(user.again) {
			selection();
		} else {
			exit();
		}
	});
}

function exit() {
	connection.end();
	console.log("Have a great day!");
}

selection();