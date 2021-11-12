// Page stuff

// FIXME this should be sent from the server
const duration = 5489;

function keyDownWhileTyping(e)
{
	if(event.key === "Enter")
	{
		redirectFromInput();
	}
}

function redirectTo(input)
{
	if(input && input !== userInput) // passed from ejs
	{
		location.href = "/" + input;
	}
}

function redirectFromInput()
{
	redirectTo(document.getElementById("seconds").value);
}

function redirectToRandom()
{
	redirectTo(randomInt(1, duration));
}

async function copyImageToClipboard()
{
	if(serverImage) // passed from ejs
	{
		let response = await fetch(serverImage);
		let blob = await response.blob();
		await navigator.clipboard.write([ new ClipboardItem({ "image/png": blob }) ]);
	}
}



// Util

function randomInt(min, max) // min and max included
{
	return Math.floor(Math.random() * (max - min + 1) + min)
}