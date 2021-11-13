const fs = require("fs");
const util = require("util");
const path = require("path");
const https = require("https");
const express = require("express");
const extractFrames = require("ffmpeg-extract-frames");
const pngCrop = require("png-crop");

// Command line args

if(!fs.existsSync(process.argv[2]))
{
	console.log("Movie file %s does not exist!", process.argv[2]);
	return;
}

// Constants

// Private stuff

const pathToSsl = path.join(__dirname, "private", "ssl");
const pathToAnalytics = path.join(__dirname, "private", "analytics");

// Server stuff
const app = express();
const redirectApp = express();

// Movie stuff
const pathToMovie = process.argv[2];
const duration = 5489; // FIXME this should be sent from the server and also calculated!

// Other
const frames = new Array(duration).fill(false);



// Server logic

redirectApp.get("*", (req, res) =>
{
	res.redirect("https://" + req.headers.host + req.url);
});

redirectApp.listen(80, () =>
{
	console.log("Listening on port 80!");
	console.log();
});

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>
{
	console.log("%s - Received request from %s for %s", new Date().toLocaleString("en-US"), req.ip, "main page");

	res.status(200).render("index", { image: "", input: "" });

	console.log("Response sent");
	console.log();
});

app.get("/:second", async (req, res) =>
{
	let input = req.params.second;
	let second = +input;
	let image = "";

	console.log("%s - Received request from %s for %s", new Date().toLocaleString("en-US"), req.ip, input);

	if(isValidFrame(second))
	{
		image = "/img/" + second + ".png";

		if(!frames[second])
		{
			let pathToFile = path.join(__dirname, "public", "img", second + ".png");

			console.log("%s is not cached.. Try to find it in %s", second, pathToFile);

			if(!fs.existsSync(pathToFile))
			{
				console.log("Image not found! Extracting..");

				await extractFrames({ input: pathToMovie, output: pathToFile, offsets: [ second * 1000 ] });

				console.log("Image extracted");

				await crop(pathToFile, pathToFile, { width: 1920, height: 800, top: 140, left: 0 });

				console.log("Image cropped");
			}
			else
			{
				console.log("Image found and cached");
			}
		}

		frames[second] = true;
	}
	else
	{
		console.log("%s is an invalid frame!", input);
	}

	res.status(200).render("index", { image: image, input: input });

	console.log("Response sent");
	console.log();
});

https
	.createServer(
	{
		cert: fs.readFileSync(path.join(pathToSsl, "ponyfra_me.crt")),
		key: fs.readFileSync(path.join(pathToSsl, "ponyfra_me.key")),
		ca: fs.readFileSync(path.join(pathToSsl, "ponyfra_me.ca-bundle"));
	}, app)
	.listen(443, () =>
	{
		console.log("Listening on port 443!");
		console.log();
	});


function recordRequestAnalytics(req)
{
	let requestAnalytics = { requests: [] };
	let pathToRequestAnalytics = path.join(pathToAnalytics, "requests.json");

	if(!fs.existsSync(pathToRequestAnalytics))
	{
		requestAnalytics = JSON.parse(pathToRequestAnalytics);
	}

	requestAnalytics.requests.push(
	{
		ip: req.ip,
		timestamp: Date.now(),
		localtime: new Date().toLocaleString("en-US"),
		input: req.params.second,
		fullinput: req.originalUrl
	});

	fs.writeFileSync(pathToRequestAnalytics, JSON.stringify(requestAnalytics), err => console.log(err));
}



// Util functions

const crop = util.promisify(pngCrop.crop);

function isValidFrame(second)
{
	if(isNaN(second))
	{
		return false;
	}

	return second > 0 && second <= 5489;
}