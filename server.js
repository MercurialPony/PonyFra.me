const fs = require("fs");
const util = require("util");
const path = require("path");
const express = require("express");
const extractFrames = require("ffmpeg-extract-frames");
const pngCrop = require("png-crop");

// Constants

// Server stuff
const app = express();
const port = 443;

// Movie stuff
const pathToMovie = "D:/Downloads/YP-1N-G5-ANewGeneration.mkv";
const duration = 5489;

// Other
const frames = new Array(duration).fill(false);



// Server logic

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>
{
	console.log("Received request from %s for main page", req.ip);

	res.status(200).render("index", { image: "", input: "" });

	console.log("Response sent");
	console.log();
});

app.get("/:second", async (req, res) =>
{
	let input = req.params.second;
	let second = +input;
	let image = "";

	console.log("Received request from %s for %s", req.ip, input);

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

app.listen(port, () =>
{
	console.log("Listening on port %s!", port);
	console.log();
});



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