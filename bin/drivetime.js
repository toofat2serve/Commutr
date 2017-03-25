/*globals i:true google*/
/*eslint-env jquery */
function fb(l, d) {
	console.log(l + ":");
	console.log(d);
}

function hours() {
	return ["12AM", "1AM", "2AM", "3AM", "4AM", "5AM", "6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"];
}

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
	return {compD, minD};
}

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
	fb("Origin", o);
	fb("Destination", d);
	dt = dt.split("-");
	var tm = Number($(".time").val()) - 1;
	var iv = Number($(".intervalselect").val());
	var ts = Number($(".timespanselect").val());
	var outlook = $(".outlookselect").val();
	fb("Date is today?", $(".date").val() === compDate()[0]);
			var curHrs = new Date().getHours();
			for (i in hours) {
				if (i < curHrs && ($(".date").val() === compDate()[0])) {
					//$(".time").selectmenu( Number(i) + 1,"disabled",true);
					alert("Today!");
				}
				else {
				//	$(".time").selectmenu( Number(i) + 1,"disabled",false);
					alert("Not Today!");
				}
			}
	
	// Determine how many times to query Google
	var iterations = ts * 60 / iv;

	// Set the first run date
	var runDt = new Date(Number(dt[2]), Number(dt[0]) - 1, Number(dt[1]), tm);
	fb("Run Date", runDt);
	// Set up minutes/hours for subsequent iterations
	var minHand = 0;
	var hrHand = tm;


	//Loop through iterations, adding time as needed
	for (i = 0; i < iterations; i++) {
		if (minHand === 60) {
			minHand = 0;
			hrHand += 1;
		}
		runDt.setHours(hrHand, minHand);
		minHand += iv;

		var timeStamp = Number(Date.parse(runDt)) / 1000;
		askGoogle(o, d, timeStamp, outlook);
	}
}

function askGoogle(o, d, ts, ol) {
	var dOpts = {
		departureTime: new Date(ts * 1000),
		trafficModel: ol
	};
	var mydata = {
		origins: [o],
		destinations: [d],
		travelMode: 'DRIVING',
		drivingOptions: dOpts,
	};
	fb("TimeStamp", ts);
	fb("Departure Time", dOpts.departureTime);
	fb("Traffic Model", ol);
	var service = new google.maps.DistanceMatrixService();
	service.getDistanceMatrix(mydata, function callback(response, st) {
		var statusIn = st;
		if (st === "OK") {
			var travelTime = Math.round(response.rows[0].elements[0].duration_in_traffic.value / 60, 0);
			var dT = mydata.drivingOptions.departureTime;
			var minStr = dT.getMinutes() < 10 ? "0" + dT.getMinutes() : dT.getMinutes();
			var ampm = dT.getHours() > 11 ? "PM" : "AM";
			var hrStr = dT.getHours() > 11 ? dT.getHours() - 12 : dT.getHours();
			hrStr = hrStr < 10 ? "0" + hrStr : hrStr;
			var departureTime = hrStr + ":" + minStr + " " + ampm;
			var dTms = new Date(dT);
			dTms = dTms.valueOf();
			var tr = $("<tr v='" + dTms + "'></tr>");
			tr.append($("<td></td>").text(departureTime));
			tr.append($("<td></td>").text(travelTime));
			$(".results").append(tr);
			//fb("Travel Time", travelTime);
			orderRows();
		}
		fb("Status", statusIn);
	});
}

function orderRows() {
	// Because asynchronous means asynchronous.
	var rows = []
	var t = $(".results > tr:has(td)");
	var numRows = t.length;
	if (numRows > 0) {
		for (var i in t) {
			var rowObj = {
							order: i,
							depTimeCode: t[i].attributes[0].nodevalue,
							depTimeDisp: t[i].firstChild.innerText,
							comTimeDisp: t[i].lastChild.innerText
						};
			rows.push(rowObj);
		}
	}
}

function genForm() {
	// Since IE is a butt, a little JS magic to get rounded corners on the fieldsets
	// and legends by wrapping them in classed divs.
	$("fieldset").wrap("<div class='bwrap'></div>");
	//Set up the minimum date validation
	var testing = true;
	var opt;
	$(".date").attr("min", compDate()[1]);
	fb("Min Date", compDate()[1]);
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
	var dateIn = $(".date");

	for (i in hours) {
		//$(".time").selectmenu( (Number(i) + 1), { disabled: true }, {value: Number(i) + 1}  );
		opt = $("<option></option>").text(hours[i]);
		opt.attr("value", Number(i) + 1);
		timeSel.append(opt);
	}
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
		$(".time").val(5);
		$(".intervalselect").val(60);
		$(".timespanselect").val(2);
	}
	//Handle form submission
	$(".gmquery").submit(function(ev) {
		var eventIn = ev;
		eventIn.preventDefault();
		submitMe();
	});

}