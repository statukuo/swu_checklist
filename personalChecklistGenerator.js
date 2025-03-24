var fs = require('fs');
var {parse} = require('csv-parse');

var csvData={};

fs.createReadStream("./" + process.argv[2])
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
        console.log(csvrow);

        const data = csvrow;
        const type =  data[6];

        if (!csvData[type]) {
            csvData[type] = {};
        }
        if(!csvData[type][data[0]]) {
            csvData[type][data[0]] = [];
        }


        csvData[type][data[0]].push({
            set: data[0],
            number: data[1].padStart(3, "0"),
            checkboxes:new Array(parseInt(data[5])).fill("").map((_, idx) => idx < data[3]? "\\begin{tikzpicture}\\filldraw[black] (31mm,1.5mm) circle (2pt);\\end{tikzpicture}" : "\\begin{tikzpicture}\\draw[gray] (31mm,1.5mm) circle (2pt);\\end{tikzpicture}"),
            rarity: data[4][0].toLowerCase(),
            title: data[2].substring(0,25)
        });
    })
    .on('end',function() {
        let templateToReplace = "";

        for (const type in csvData) {
            if(type==="Promo") {
                templateToReplace = templateToReplace.concat(`\\section{${type}} \n`);
                templateToReplace = templateToReplace.concat("\\vspace{-2mm} \n");
            }
            for (const set in csvData[type]) {
                if(type==="Normal") {
                    templateToReplace = templateToReplace.concat(`\\section{${type + " - " + set}} \n`);
                    templateToReplace = templateToReplace.concat("\\vspace{-2mm} \n");
                }
                csvData[type][set].forEach(entry => {
                    templateToReplace = templateToReplace.concat(`\\texttt{${type==="Promo"? entry.set + " - ": ""}${entry.number}} ${entry.checkboxes.join("")} \\makebox[2mm][r]{\\raisebox{-1mm}{\\includegraphics[height=3mm]{${entry.rarity}}}} \\texttt{${entry.title}} \\vspace{-0.3mm}\\\\ \n`);
                });
            }

        }
        templateToReplace = templateToReplace.concat(`\\swuSet{${process.argv[2].split(".")[0]}}`)

        const newFilePath = "./" + process.argv[2].split(".")[0] + ".tex"

        fs.readFile("template.tex", 'utf-8', (err, contents) => {
            if (err) {
                return console.error(err)
            }

            // Replace string occurrences
            const updated = contents.replace(/%{TEMPLATE}/gi, templateToReplace)

            // Write back to file
            fs.writeFile(newFilePath, updated, 'utf-8', err2 => {
                if (err2) {
                    console.log(err2)
                }

                console.log("New checklist created at: " + newFilePath)
            })
        });

        console.log(templateToReplace)
    });
