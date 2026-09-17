## SWU CHECKLIST CREATOR
### Install

First make sure you have all the packages installed from npm

`npm install`

Then install `pdflatex` on your system ( [here](https://gist.github.com/rain1024/98dd5e2c6c8c28f9ea9d) is a small guide to install it on ubuntu )


### Usage


To create a checklist you need to first create a csv file with the following fields (no header)

> Set,Number(###),Name,Rarity,Type,Main Aspect,PlaysetCount

You can use any of the present csv files (sor.csv, shd.csv...) to copy the structure

Then run the following command (will use lof.csv as example)

`node checklistGenerator.js lof.csv` => this will create the lof.tex

`pdflatex lof.tex` => this will generate the lof.pdf

### Personal checklist

There is also a script that allows to print a pdf with the missing cards. The structure for this is slightly different from the set one. You need to use this fileds on the csv file

> Set,Number(###),Name,Collection Count,Rarity,Playset,(Normal | Promo)

Then run

`node personalChecklistGenerator.js personal.csv`

`pdflatex personal.tex`

### Translate card names

There is a script that takes a set csv file and creates a copy of it with the card names (3rd column) translated to another language. It matches each row by Set + Number against the official Star Wars Unlimited card database (starwarsunlimited.com), so the rest of the columns stay untouched.

`node scripts/translateCsvNames.js <csvFile> <locale>`

Supported locales: `en`, `es`, `fr`, `de`, `it`

Example (will use twi.csv as example)

`node scripts/translateCsvNames.js twi.csv es` => this will create twi-es.csv

### Cleanup

`pdflatex` leaves `.aux` and `.log` files behind on every run. To remove them:

`rm -f *.aux *.log`
