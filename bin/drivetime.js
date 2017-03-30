/*globals i:true google*/
/*eslint-env jquery */

function submitMe() {
	// Establish the table for the ajax return
	var t = $(".results");
	t.empty();
	var tr = $("<tr></tr>");
	tr.append($("<th></th>").text("Time Stamp"));
	tr.append($("<th></th>").text("Travel Time"));
	t.append(tr);
	// Read variables in (or declare them for quicker testing)
	var o = $(".origin").val();
	var d = $(".destination").val();
	var dt = $(".date").val();
	dt = dt.split("-");
	var tm = Number($(".time").val()) - 1;
	var iv = Number($(".intervalselect").val());
	var ts = Number($(".timespanselect").val());
	var outlook = $(".outlookselect").val();


	// Determine how many times to query Google
	var iterations = ts * 60 / iv;
	// Set the first run date
	var runDt = new Date(Number(dt[2]), Number(dt[0]) - 1, Number(dt[1]), tm);
	// Set up minutes/hours for subsequent iterations
	var minHand = 0;
	var hrHand = tm;
	for (i = 0; i < iterations; i++) {
		tr = $("<tr></tr>");
		t.append(tr);
	}
	//Loop through iterations, adding time as needed
	for (i = 0; i < iterations; i++) {
		// Add a row for each query
		tr = $("<tr></tr>");
		// Manage the timestamp and incrementation
		if (minHand === 60) {
			minHand = 0;
			hrHand += 1;
		}
		runDt.setHours(hrHand, minHand);
		minHand += iv;
		var timeStamp = Number(Date.parse(runDt)) / 1000;
		var dOpts = {
			departureTime: new Date(timeStamp * 1000),
			trafficModel: outlook
		};
		var mydata = {
			origins: [o],
			destinations: [d],
			travelMode: 'DRIVING',
			drivingOptions: dOpts,
		};
		var qG = queGoogle(mydata, i + 1, t);
		qG.then(function(response, index, travelTime, departureTime) {
			var trs = $(".results > tr");
			console.log(response);
			var td = $("<td></td>").text(departureTime);
			trs.eq(index).append(td);
			td = $("<td></td>").text(travelTime);
			trs.eq(index).append(td);
		});
	}
}

function queGoogle(mydata, index) {
	var service = new google.maps.DistanceMatrixService();
	var dfd = $.Deferred();
	service.getDistanceMatrix(mydata, function(response, st) {
		var travelTime = Math.round(response.rows[0].elements[0].duration_in_traffic.value / 60, 0);
		var departureTime = prettyTime(mydata.drivingOptions.departureTime);
		if (st === google.maps.DistanceMatrixStatus.OK)
			dfd.resolve(response, index, travelTime, departureTime);
		else
			dfd.reject(status);
	});
	return dfd.promise();
}

function genForm() {
	// Since IE is a butt, a little JS magic to get rounded corners on the fieldsets
	// by wrapping them in classed divs.
	$("fieldset").wrap("<div class='bwrap'></div>");

	//Fix inconsistent centering of legends in Firefox
	$("legend").wrap("<div class='cwrap'></div>");
	//Set up the minimum date validation
	var testing = true;
	var opt;
	$(".date").attr("min", compDate()[1]);
	//Construct interval options
	var intervalOptions = [5, 10, 15, 20, 30, 60];
	var intSel = $(".intervalselect");
	for (i in intervalOptions) {
		opt = $("<option></option>").text(intervalOptions[i] + " min");
		opt.attr("value", intervalOptions[i]);
		intSel.append(opt);
	}
	//Construct timespan options
	var tsSel = $(".timespanselect");
	for (i = 1; i <= 5; i++) {
		opt = $("<option></option>").text([i] + " hour(s)");
		opt.attr("value", i);
		tsSel.append(opt);
	}
	//Construct the start time options
	var hours = ["12AM", "1AM", "2AM", "3AM", "4AM", "5AM", "6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"];
	var timeSel = $(".time");
	timeSel.prop("disabled", false);
	for (i in hours) {
		//$(".time").selectmenu( (Number(i) + 1), { disabled: true }, {value: Number(i) + 1}  );
		opt = $("<option></option>").text(hours[i]);
		opt.attr("value", Number(i) + 1);
		timeSel.append(opt);
	}
	var curHrs = new Date().getHours();
	var opts = $(".time > option");
	opts.eq(curHrs + 1).prop("selected", true);
	//Construct the drive outlook adjustment
	var outlookSel = $(".outlookselect");
	var outlooks = [{
		o: "Default",
		v: "bestguess"
	}, {
		o: "Optimistic",
		v: "optimistic"
	}, {
		o: "Pessimistic",
		v: "pessimistic"
	}];
	for (i in outlooks) {
		opt = $("<option></option>").text(outlooks[i].o);
		opt.attr("value", outlooks[i].v);
		outlookSel.append(opt);
	}
	//insert test values if testing
	if (testing) {
		$(".origin").val("72 Fairview Ave Jersey City NJ 07304");
		$(".destination").val("600 W59th St New York, NY 10019");
		//$(".date").val("03-28-2017");
		//$(".time").val(5);
		$(".intervalselect").val(60);
		$(".timespanselect").val(1);
	}
	// Handle the hours options if date is today

	$(".date").on("change", function() {
		curHrs = new Date().getHours();
		opts = $(".time > option");
		var j;
		for (j = 0; j < 24; j++) {
			if (j <= curHrs && ($(".date").val() === compDate()[0])) {
				opts.eq(Number(j)).prop("disabled", true);
			} else {
				opts.eq(Number(j)).prop("disabled", false);
			}
		
		}
	});
	//apply datepicker
	$(".date").datepicker({
		dateFormat: "mm-dd-yy",
		minDate: new Date()
	});

	//Handle form submission
	$(".gmquery").submit(function(ev) {
		var eventIn = ev;
		eventIn.preventDefault();
		submitMe();
	});
}

// Swap origin and destination
function swap() {
	var d = $(".destination").val();
	var o = $(".origin").val();
	$(".origin").val(d);
	$(".destination").val(o);
}

//Format the departure time
function prettyTime(dT) {
	var minStr = dT.getMinutes() < 10 ? "0" + dT.getMinutes() : dT.getMinutes();
	var ampm = dT.getHours() > 11 ? "PM" : "AM";
	var hrStr = dT.getHours() > 11 ? dT.getHours() - 12 : dT.getHours();
	hrStr = hrStr < 10 ? "0" + hrStr : hrStr;
	return hrStr + ":" + minStr + " " + ampm;
}

// Get the minimum date for the calendar
function compDate() {
	var d = Date();
	d = d.split(" ");
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	for (i in months) {
		if (d[1] === months[i]) {
			var m = Number(i) < 9 ? "0" + (Number(i) + 1) : Number(i) + 1;
		}
	}
	var minD = d[3] + "-" + m + "-" + d[2];
	var compD = m + "-" + d[2] + "-" + d[3];
	return [compD, minD];
}
