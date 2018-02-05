[![Build Status](https://travis-ci.org/tdietrich513/hots-info-bot.svg?branch=master)](https://travis-ci.org/tdietrich513/hots-info-bot)

# HOTS Info Bot 
Discord chatbot for helpfully providing Heroes of the Storm skill and talent information in chat

## Adding the bot to your server
If you're running a discord server, you should be able to add the bot by going [here](https://discordapp.com/oauth2/authorize?client_id=407735948667912214&scope=bot&permissions=0) and doing the needful.

## Usage

Place double square brackes around the search, like so: `[[search]]`. The search can be anywhere in a message, and you can even perform more than one search per message.

### Talent or Skill Searches
Search for a talent or skill by surrounding your search with double square brackets. 

For example: `[[haunting wave]]`.

You can also search for a talent or skill by keywords in the description by prefixing the search with a ?.

For example: `[[?chill]]`.

### Hero Overview
Display a Hero's skills and get a link to popular builds by searching for the hero's exact name.

For Example: `[[Sgt. Hammer]]`

### Hero Talent Tier Searches 
Display a Hero's talent tier by searching for the hero's name (or part of it) followed by a slash and the tier level.

For example `[[Hammer/10]]`.

### Notes:
The bot will only search for the first four items in any given message. If there are too many results for any given search, the bot will attempt to truncate the results to avoid spamming the channel, and if there are way too many results, the bot will send you a direct message with your results.

Please ensure the bot has "Embed Images" permissions to get the best looking results, otherwise it will fall back to text only responses which may not look as nice.

Game information sourced from [this repo](https://github.com/heroespatchnotes/heroes-talents) and will only be as accurate as it is.
