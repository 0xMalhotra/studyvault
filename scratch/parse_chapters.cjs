const fs = require('fs');
const chaptersConfig = fs.readFileSync('d:/jee scraper/chapters_config.py', 'utf-8');
const chaptersMatch = chaptersConfig.match(/CHAPTERS = \[([\s\S]*?)\]/);
if (chaptersMatch) {
    const raw = chaptersMatch[1];
    const entries = [];
    const entryRegex = /\{([\s\S]*?)\}/g;
    let m;
    while ((m = entryRegex.exec(raw)) !== null) {
        const entryStr = m[1];
        const subjectMatch = entryStr.match(/"subject":\s*"(.*?)"/);
        const chapterMatch = entryStr.match(/"chapter":\s*"(.*?)"/);
        if (subjectMatch && chapterMatch) {
            entries.push({ subject: subjectMatch[1], chapter: chapterMatch[1] });
        }
    }
    const subjects = {};
    entries.forEach(e => {
        if (!subjects[e.subject]) subjects[e.subject] = [];
        subjects[e.subject].push(e.chapter);
    });
    console.log(JSON.stringify(subjects, null, 2));
}
